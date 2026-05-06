import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from PIL import ImageFile
import os

# Mengatasi gambar yang korup
ImageFile.LOAD_TRUNCATED_IMAGES = True

# --- KONFIGURASI ---
dataset_path = 'Dataset' # Pastikan folder ini ada di direktori yang sama
IMG_SIZE = (288, 288)
BATCH_SIZE = 32

# 1. Augmentasi Data (Ditingkatkan agar model lebih tangguh)
datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    brightness_range=[0.8, 1.2],
    horizontal_flip=True,
    validation_split=0.2 
)

print("⏳ Memuat data...")
train_gen = datagen.flow_from_directory(
    dataset_path, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
    class_mode='categorical', subset='training'
)

val_gen = datagen.flow_from_directory(
    dataset_path, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
    class_mode='categorical', subset='validation'
)

# 2. Arsitektur Model EfficientNetB2
base_model = EfficientNetB2(weights='imagenet', include_top=False, input_shape=(288, 288, 3))
base_model.trainable = False # Freeze dulu agar bobot awal tidak rusak

x = base_model.output # FIXED: perbaikan typo dari .ou
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.4)(x)

num_classes = len(train_gen.class_indices)
predictions = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# 3. Training Tahap 1: Hanya melatih Layer Atas
print("🚀 Tahap 1: Melatih Head Model...")
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
              loss='categorical_crossentropy', metrics=['accuracy'])

model.fit(train_gen, validation_data=val_gen, epochs=5)

# 4. Training Tahap 2: Fine-Tuning (Membuka base_model)
print("🚀 Tahap 2: Fine-Tuning seluruh model...")
base_model.trainable = True
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001), # LR lebih kecil
              loss='categorical_crossentropy', metrics=['accuracy'])

model.fit(train_gen, validation_data=val_gen, epochs=10)

# 5. Simpan Model
model.save('face_shape_model.h5')
print("✅ Selesai! Model disimpan sebagai 'face_shape_model.h5'")