# GaussianMechanism.py

import numpy as np
from algorithms.dp_algorithm import DPAlgorithm

class GaussianMechanism(DPAlgorithm):
    def generate_noisy_mean(self, data, epsilon, delta):
        # Calculate the actual mean of the data
        actual_mean = np.mean(data)

        # Calculate the noise to add to the mean
        # Assuming the sensitivity of the mean query is 1 (you may need to adjust this based on your dataset)
        sensitivity = 1
        noise_scale = np.sqrt(2 * np.log(1.25 / delta)) / epsilon
        noise = np.random.normal(0, noise_scale)

        # Add noise to the actual mean to get the noisy mean
        noisy_mean = actual_mean + noise

        return noisy_mean

    def generate_synthetic_data(self, data, sample_size, epsilon, delta, lower_clip, upper_clip):
        # Implementation of synthetic data generation using the Gaussian mechanism
        noise_scale = np.sqrt(2 * np.log(1.25 / delta)) / epsilon
        synthetic_data = data + np.random.normal(0, noise_scale, size=(sample_size, len(data)))
        # Apply clipping to the synthetic data
        synthetic_data_clipped = np.clip(synthetic_data, lower_clip, upper_clip)
        return synthetic_data_clipped
