import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from PIL import ImageFile
import os

# Cari lokasi folder script ini berada
base_dir = os.path.dirname(os.path.abspath(__file__))
# Gabungkan dengan nama folder Dataset
import os

# Gunakan path lengkap agar pasti ketemu
dataset_path = r'C:\Users\Helmy\OneDrive\Documents\tugas_coding\dtp\Dataset'

print(f"Mencoba membuka: {dataset_path}")

# Cek apakah folder beneran ada
if not os.path.exists(dataset_path):
    print("ERROR: Folder Dataset tidak ditemukan! Cek penulisan nama foldernya.")
else:
    # List folder yang ada di dalam Dataset
    isi_folder = os.listdir(dataset_path)
    print(f"Isi di dalam folder Dataset: {isi_folder}")
# Mengatasi gambar yang korup/terpotong
ImageFile.LOAD_TRUNCATED_IMAGES = True

# 1. Konfigurasi Path (Pastikan folder Dataset berisi: heart, oblong, oval, round, square)
dataset_path = 'Dataset' 
IMG_SIZE = (288, 288)
BATCH_SIZE = 32

# 2. Augmentasi Data & Split Otomatis (80% Train, 20% Validasi)
datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    validation_split=0.2 
)

print("Memuat data...")
train_gen = datagen.flow_from_directory(
    dataset_path, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
    class_mode='categorical', subset='training'
)

val_gen = datagen.flow_from_directory(
    dataset_path, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
    class_mode='categorical', subset='validation'
)

# 3. Arsitektur Model EfficientNetB2
base_model = EfficientNetB2(weights='imagenet', include_top=False, input_shape=(288, 288, 3))
x = base_model.ou
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.4)(x)

num_classes = len(train_gen.class_indices)
predictions = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# 4. Compile & Training
model.compile(optimizer=tf.keras.optimizers.Adam(0.001),
              loss='categorical_crossentropy', metrics=['accuracy'])

print(f"Kategori yang dipelajari: {list(train_gen.class_indices.keys())}")
model.fit(train_gen, validation_data=val_gen, epochs=15)

# 5. Simpan Model
model.save('face_shape_model.h5')
print("Model berhasil disimpan sebagai 'face_shape_model.h5'")