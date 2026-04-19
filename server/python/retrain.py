import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pandas as pd
import os
os.chdir("server/python")

# Load CSV without headers
data = pd.read_csv("combined.csv", header=None)

# Replace column names with the first row
data.columns = data.iloc[0]

# Remove the first row from data
data = data[1:].reset_index(drop=True)

# Features (all columns except target)
X = data.drop(columns=['Disaster_Label']).astype(float)

# Target
y = data['Disaster_Label'].astype('category').cat.codes.values

# Convert to one-hot encoding
y = to_categorical(y)

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

num_features = X_train.shape[1]
num_classes = y_train.shape[1]

model = Sequential([
    Dense(64, activation='relu', input_shape=(num_features,)),
    Dense(64, activation='relu'),
    Dense(num_classes, activation='softmax')  # Output layer for multiclass
])

# Compile the model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

model.summary()

history = model.fit(
    X_train, y_train,
    epochs=50,
    batch_size=32,
    validation_split=0.2
)
# Save the entire model to a file
model.save("natural_disaster_classifier.h5")