# data_synthesizer.py
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from opacus import PrivacyEngine

class RatingsDataset(Dataset):
    def __init__(self, ratings):
        self.ratings = ratings

    def __len__(self):
        return len(self.ratings)

    def __getitem__(self, idx):
        return self.ratings[idx]

def load_data(file_path):
    data = pd.read_csv(file_path)
    ratings = data['rating'].values.reshape(-1, 1)
    encoder = OneHotEncoder(sparse=False)
    ratings_encoded = encoder.fit_transform(ratings)
    return ratings_encoded

class RatingClassifier(nn.Module):
    def __init__(self):
        super(RatingClassifier, self).__init__()
        self.fc1 = nn.Linear(5, 64)  # Assuming input shape is (5,)
        self.fc2 = nn.Linear(64, 5)  # Assuming 5 rating categories

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.softmax(self.fc2(x), dim=1)
        return x

def prepare_data(file_path):
    ratings_encoded = load_data(file_path)
    X_train, X_test, y_train, y_test = train_test_split(
        ratings_encoded, ratings_encoded, test_size=0.2, random_state=42)
    
    train_dataset = RatingsDataset(torch.tensor(X_train, dtype=torch.float32))
    test_dataset = RatingsDataset(torch.tensor(X_test, dtype=torch.float32))

    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)
    return train_loader, test_loader

def train_model(model, train_loader, optimizer, epochs):
    criterion = nn.CrossEntropyLoss()
    for epoch in range(epochs):
        for data in train_loader:
            inputs = data.float()
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, inputs)
            loss.backward()
            optimizer.step()

def generate_synthetic_data(model, sample_size):
    synthetic_data = []
    with torch.no_grad():
        for _ in range(sample_size):
            random_input = torch.tensor(np.random.rand(1, 5), dtype=torch.float32)
            predicted_distribution = model(random_input).numpy()[0]
            synthetic_rating = np.random.choice([1, 2, 3, 4, 5], p=predicted_distribution)
            synthetic_data.append(synthetic_rating)
    return synthetic_data

def generate_private_data(file_path, sample_size, target_epsilon, target_delta, epochs):
    train_loader, test_loader = prepare_data(file_path)
    model = RatingClassifier()

    optimizer = optim.Adam(model.parameters())
    privacy_engine = PrivacyEngine()

    model, optimizer, train_loader = privacy_engine.make_private_with_epsilon(
        module=model,
        optimizer=optimizer,
        data_loader=train_loader,
        target_epsilon=target_epsilon,
        target_delta=target_delta,
        epochs=epochs,
        max_grad_norm=1.0
    )

    train_model(model, train_loader, optimizer, epochs)

    synthetic_data = generate_synthetic_data(model, sample_size)
    return synthetic_data

# Example usage:
# synthetic_ratings = generate_private_data('preprocessed_10000_entries.csv', 1000)
# print(synthetic_ratings)
