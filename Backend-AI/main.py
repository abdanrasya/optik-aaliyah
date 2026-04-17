import argparse
import base64
import io
import os

import cv2
import numpy as np
import tensorflow as tf
from insightface.app import FaceAnalysis
from PIL import Image
from rembg import remove


class HelmyVirtualTryOn:
    def __init__(self, model_name: str, assets_folder: str):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.face_app = FaceAnalysis(name='buffalo_l')
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))

        model_path = os.path.join(self.base_dir, model_name)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f'File model tidak ditemukan: {model_path}')

        self.model = tf.keras.models.load_model(model_path)
        self.class_names = ['Heart', 'Oval', 'Round', 'Square', 'Oblong']

        self.assets_path = os.path.join(self.base_dir, assets_folder)
        self.glasses_collection = []
        self.current_idx = 0
        self.load_and_clean_assets()

    def load_and_clean_assets(self):
        print('⏳ Sedang memproses dan membersihkan background kacamata...')

        if not os.path.exists(self.assets_path):
            os.makedirs(self.assets_path, exist_ok=True)
            raise FileNotFoundError(
                f'Folder asset tidak ditemukan. Buat folder dan tambahkan gambar kacamata di: {self.assets_path}'
            )

        files = sorted(
            [f for f in os.listdir(self.assets_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        )
        if not files:
            raise FileNotFoundError(f'Folder asset kosong: {self.assets_path}')

        for file_name in files:
            img_path = os.path.join(self.assets_path, file_name)
            try:
                input_image = Image.open(img_path)
                output_image = remove(input_image)
                img_np = np.array(output_image)

                if img_np.ndim == 2:
                    img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGRA)
                elif img_np.shape[2] == 3:
                    img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGRA)
                else:
                    img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGRA)

                self.glasses_collection.append(img_np)
                print(f'✅ {file_name} berhasil dibersihkan.')
            except Exception as exc:
                raise RuntimeError(f'⚠️ Gagal memproses {file_name}: {exc}')

    def preprocess_face_roi(self, roi: np.ndarray) -> np.ndarray:
        return cv2.resize(roi, (288, 288)) / 255.0

    def classify_face_shape(self, face, frame: np.ndarray) -> str:
        bbox = face.bbox.astype(int)
        face_roi = frame[max(0, bbox[1]):bbox[3], max(0, bbox[0]):bbox[2]]
        if face_roi.size == 0:
            return 'Unknown'
        face_roi = self.preprocess_face_roi(face_roi)
        pred = self.model.predict(np.expand_dims(face_roi, axis=0), verbose=0)
        return self.class_names[int(np.argmax(pred))]

    def overlay_logic(self, frame: np.ndarray, face, glasses_img: np.ndarray) -> np.ndarray:
        kps = face.kps
        left_eye, right_eye = kps[0], kps[1]
        dist = np.linalg.norm(right_eye - left_eye)
        w = int(dist * 2.4)
        h = int(glasses_img.shape[0] * (w / glasses_img.shape[1]))

        cx, cy = int((left_eye[0] + right_eye[0]) / 2), int((left_eye[1] + right_eye[1]) / 2)
        x1, y1 = cx - (w // 2), cy - (h // 2)
        x2, y2 = x1 + w, y1 + h

        if x1 < 0 or y1 < 0 or x2 > frame.shape[1] or y2 > frame.shape[0]:
            return frame

        overlay = cv2.resize(glasses_img, (w, h))
        alpha = overlay[:, :, 3] / 255.0
        for c in range(3):
            frame[y1:y2, x1:x2, c] = (
                alpha * overlay[:, :, c] + (1 - alpha) * frame[y1:y2, x1:x2, c]
            )
        return frame

    def run_desktop(self) -> None:
        cap = cv2.VideoCapture(0)
        print("Aplikasi Jalan! Tekan 'N' untuk ganti kacamata, 'Q' untuk keluar.")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.flip(frame, 1)

            faces = self.face_app.get(frame)
            for face in faces:
                bbox = face.bbox.astype(int)
                shape = self.classify_face_shape(face, frame)
                cv2.putText(frame, f'Bentuk: {shape}', (bbox[0], bbox[1] - 10), 0, 0.7, (0, 255, 0), 2)
                frame = self.overlay_logic(frame, face, self.glasses_collection[self.current_idx])

            cv2.imshow('Virtual Try-On Helmy', frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('n'):
                self.current_idx = (self.current_idx + 1) % len(self.glasses_collection)

        cap.release()
        cv2.destroyAllWindows()

    def predict_image(self, image_bytes: bytes, glasses_index: int = 0) -> dict:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        faces = self.face_app.get(frame)
        result_faces = []
        for face in faces:
            shape = self.classify_face_shape(face, frame)
            frame = self.overlay_logic(frame, face, self.glasses_collection[glasses_index])
            result_faces.append({
                'shape': shape,
                'bbox': [int(v) for v in face.bbox.astype(int).tolist()],
            })

        _, buffer = cv2.imencode('.png', frame)
        encoded_image = base64.b64encode(buffer).decode('utf-8')
        return {'image': encoded_image, 'faces': result_faces}

    def create_web_app(self):
        from fastapi import FastAPI, File, HTTPException, UploadFile
        from fastapi.middleware.cors import CORSMiddleware
        from fastapi.responses import HTMLResponse, JSONResponse

        app = FastAPI(title='Helmy Virtual Try-On API')
        app.add_middleware(
            CORSMiddleware,
            allow_origins=['*'],
            allow_credentials=True,
            allow_methods=['*'],
            allow_headers=['*'],
        )

        @app.get('/', response_class=HTMLResponse)
        async def home():
            return '''
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>Helmy Virtual Try-On</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; padding: 16px;">
                        <h1>Helmy Virtual Try-On</h1>
                        <p>Unggah foto dari HP atau desktop untuk melihat kacamata overlay.</p>
                        <form id="uploadForm" enctype="multipart/form-data">
                            <input type="file" name="file" accept="image/png, image/jpeg" capture="environment" />
                            <br /><br />
                            <label>Glasses index: <input type="number" name="glasses_index" value="0" min="0" /></label>
                            <br /><br />
                            <button type="submit">Proses</button>
                        </form>
                        <p id="message"></p>
                        <img id="result" style="max-width:100%; margin-top: 16px; display:none;" />
                        <script>
                            const form = document.getElementById('uploadForm');
                            const message = document.getElementById('message');
                            const result = document.getElementById('result');
                            form.addEventListener('submit', async (event) => {
                                event.preventDefault();
                                const data = new FormData(form);
                                const glassesIndex = data.get('glasses_index') || 0;
                                const response = await fetch(`/predict?glasses_index=${glassesIndex}`, {
                                    method: 'POST',
                                    body: data,
                                });
                                if (!response.ok) {
                                    const error = await response.json();
                                    message.textContent = error.detail || 'Terjadi kesalahan';
                                    result.style.display = 'none';
                                    return;
                                }
                                const json = await response.json();
                                message.textContent = json.faces.map(f => f.shape).join(', ');
                                result.src = `data:image/png;base64,${json.image}`;
                                result.style.display = 'block';
                            });
                        </script>
                    </body>
                </html>
            '''

        @app.get('/health')
        async def health_check():
            return JSONResponse({'status': 'ok'})

        @app.post('/predict')
        async def predict(file: UploadFile = File(...), glasses_index: int = 0):
            if file.content_type not in {'image/png', 'image/jpeg', 'image/jpg'}:
                raise HTTPException(status_code=400, detail='Hanya mendukung image/png, image/jpg, atau image/jpeg')
            image_bytes = await file.read()
            result = self.predict_image(image_bytes, glasses_index=glasses_index)
            if not result['faces']:
                raise HTTPException(status_code=404, detail='Wajah tidak terdeteksi dalam gambar')
            return result

        return app


def main() -> None:
    parser = argparse.ArgumentParser(description='Helmy Virtual Try-On: desktop dan web dalam satu file')
    parser.add_argument('--mode', choices=['desktop', 'web'], default='desktop', help='Pilih mode: desktop atau web')
    parser.add_argument('--host', default='0.0.0.0', help='Host untuk mode web')
    parser.add_argument('--port', type=int, default=8000, help='Port untuk mode web')
    args = parser.parse_args()

    service = HelmyVirtualTryOn('face_shape_model.h5', 'assets_2d')

    if args.mode == 'desktop':
        service.run_desktop()
    else:
        try:
            import uvicorn
        except ImportError as exc:
            raise RuntimeError('uvicorn belum terpasang. Install dengan pip install uvicorn[standard]') from exc
        app = service.create_web_app()
        uvicorn.run(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
