# dp_gan.py

import numpy as np
import tensorflow as tf
from tensorflow_privacy.privacy.optimizers.dp_optimizer import DPGradientDescentOptimizer
from tensorflow_privacy.privacy.dp_query.gaussian_query import GaussianSumQuery
from tensorflow_privacy.privacy.analysis.compute_dp_sgd_privacy_lib import compute_dp_sgd_privacy_statement
from tensorflow_privacy.privacy.analysis.compute_noise_from_budget_lib import compute_noise
import tensorflow_probability as tfp

from algorithms.dp_algorithm import DPAlgorithm

class DPGAN(DPAlgorithm):
    def build_generator(self):
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_dim=1),
            tf.keras.layers.Dense(256, activation='relu'),
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dense(1, activation='linear')  # Linear activation
        ])
        return model

    def build_discriminator(self):
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(512, activation='relu', input_dim=1),  # Input dimension is 1 (for one rating)
            tf.keras.layers.Dense(256, activation='relu'),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.LeakyReLU(alpha=0.0001),
            tf.keras.layers.Dense(1, activation='sigmoid')  # Output is a probability
        ])
        return model

    # Loss function calculating discriminator's ability to catch generator
    @staticmethod
    def discriminator_loss(labels, predictions):
        loss = tf.keras.losses.BinaryCrossentropy(from_logits=False)(labels, predictions)
        return loss

    # Loss function calculating generator's ability to fool discriminator
    @staticmethod
    def generator_loss(fake_output):
        return tf.keras.losses.BinaryCrossentropy(from_logits=False)(tf.ones_like(fake_output), fake_output)
    
    # Loss function calculating difference from mean
    @staticmethod
    def average_rating_loss(real_data_avg, synthetic_data):
        synthetic_data_avg = tf.reduce_mean(synthetic_data)
        return tf.abs(real_data_avg - synthetic_data_avg)
    
    # Loss function calculating difference from median
    @staticmethod
    def median_rating_loss(real_data_median, synthetic_data):
        synthetic_data_median = tfp.stats.percentile(synthetic_data, 50.0, interpolation='midpoint')  # Compute the median
        return tf.abs(real_data_median - synthetic_data_median)

    # Loss function calculating difference from minimum
    @staticmethod
    def min_rating_loss(real_data_min, synthetic_data):
        synthetic_data_min = tf.reduce_min(synthetic_data)
        return tf.abs(real_data_min - synthetic_data_min)
    
    # Loss function calculating difference from maximum
    @staticmethod
    def max_rating_loss(real_data_max, synthetic_data):
        synthetic_data_max = tf.reduce_max(synthetic_data)
        return tf.abs(real_data_max - synthetic_data_max)

    def generate_synthetic_data(self, data, sample_size, epsilon, delta, lower_clip, upper_clip):
        epochs = 10
        batch_size = 100
        noise_dim = 1
        print_interval = 1
        # Convert data to TensorFlow Dataset
        data = tf.data.Dataset.from_tensor_slices(data).batch(batch_size)
        number_of_examples = len(data)
        learning_rate_reduction_factor = 0.5  # Factor to reduce learning rate
        reduce_every_epochs = 5  # Reduce learning rate every 5 epochs
        # Variables to track the minimum loss
        min_g_loss = float('inf')
        min_d_loss = float('inf')
        loss_reduction_threshold = 0.00000001  # Threshold to trigger learning rate reduction

        # Calculate noise multiplier
        noise_multiplier = compute_noise(number_of_examples, batch_size, epsilon, epochs, delta, noise_lbd=1e-1)

        l2_norm_clip = 1.0

        # Calculate the privacy statement
        # Use compute_dp_sgd_privacy_statement to get the privacy statement
        privacy_statement = compute_dp_sgd_privacy_statement(
            number_of_examples=number_of_examples,
            batch_size=batch_size,
            num_epochs=epochs,
            noise_multiplier=noise_multiplier,
            delta=delta,
            used_microbatching=True,  # Assuming microbatching is used
            max_examples_per_user=1,  # Assuming no limit on examples per user
        )
        print(privacy_statement)

        # Build the generator and discriminator
        generator = self.build_generator()
        discriminator = self.build_discriminator()

        # Initial learning rates
        lr_discriminator = 0.000099
        lr_generator = 0.001

        # Initial Optimizers
        dp_sum_query = GaussianSumQuery(l2_norm_clip, noise_multiplier)
        optimizer = DPGradientDescentOptimizer(dp_sum_query=dp_sum_query, num_microbatches=1, learning_rate=lr_discriminator)
        non_dp_optimizer = tf.keras.optimizers.Adam(learning_rate=lr_generator)

        # Compile the discriminator with the DP optimizer
        discriminator.compile(optimizer=optimizer, loss='binary_crossentropy')

        # Variables to track the minimum loss
        min_g_loss = float('inf')
        min_d_loss = float('inf')
        loss_reduction_threshold = 0.01  # Threshold to trigger learning rate reduction

        # GAN training loop
        for epoch in range(epochs):
            total_g_loss = 0
            total_d_loss = 0
            num_batches = 0
            # Update learning rate based on scheduler
            if (epoch + 1) % reduce_every_epochs == 0:
                lr_discriminator *= learning_rate_reduction_factor
                lr_generator *= learning_rate_reduction_factor

                # Reinitialize optimizers with new learning rates
                optimizer = DPGradientDescentOptimizer(dp_sum_query=dp_sum_query, num_microbatches=1, learning_rate=lr_discriminator)
                non_dp_optimizer = tf.keras.optimizers.Adam(learning_rate=lr_generator)

            for real_data in data:
                # Reshape real_data if it is 1-dimensional
                if len(real_data.shape) == 1:
                    real_data = tf.expand_dims(real_data, axis=-1)

                # Ensure real_data is a float32 tensor if it's not already
                real_data = tf.cast(real_data, tf.float32)

                # Determine current batch size (may be smaller than the fixed batch size for the last batch in data)
                current_batch_size = tf.shape(real_data)[0]
                # Calculate average rating of real data
                real_data_avg = tf.reduce_mean(real_data)
                real_data_median = tfp.stats.percentile(real_data, 50.0, interpolation='midpoint')  # Compute the median
                real_data_min = tf.reduce_min(real_data)
                real_data_max = tf.reduce_max(real_data)

                # Generate batch of synthetic data
                noise = tf.random.normal([current_batch_size, noise_dim])
                synthetic_data = generator(noise, training=True)

                # Combine real and synthetic data
                combined_data = tf.concat([real_data, synthetic_data], axis=0)
                # Dynamically create labels for real and synthetic data
                labels_real = tf.ones((current_batch_size, 1), dtype=tf.float32)
                labels_synthetic = tf.zeros((current_batch_size, 1), dtype=tf.float32)
                labels_combined = tf.concat([labels_real, labels_synthetic], axis=0)

                # Train the discriminator
                with tf.GradientTape(persistent=True) as disc_tape:
                    discriminator_output = discriminator(combined_data, training=True)
                    d_loss = self.discriminator_loss(labels_combined, discriminator_output)
                    d_loss_value = self.discriminator_loss(labels_combined, discriminator_output)
                    d_gradients = optimizer.compute_gradients(d_loss, discriminator.trainable_variables, gradient_tape=disc_tape)

                # Apply gradients through DP optimizer
                optimizer.apply_gradients(d_gradients)

                # Train the generator
                with tf.GradientTape(persistent=True) as gen_tape:
                    synthetic_data = generator(noise, training=True)
                    # Existing generator loss
                    predictions = discriminator(synthetic_data, training=False)
                    g_loss = self.generator_loss(predictions)
                    # Calculate average rating loss
                    avg_rating_loss = self.average_rating_loss(real_data_avg, synthetic_data)
                    median_rating_loss = self.median_rating_loss(real_data_median, synthetic_data)
                    min_rating_loss = self.min_rating_loss(real_data_min, synthetic_data)
                    max_rating_loss = self.max_rating_loss(real_data_max, synthetic_data)
                    # Combine losses
                    combined_g_loss = avg_rating_loss + median_rating_loss + min_rating_loss + max_rating_loss + g_loss
                    # Compute and apply gradients

                # Compute and apply gradients through standard optimizer
                g_gradients = gen_tape.gradient(combined_g_loss, generator.trainable_variables)
                non_dp_optimizer.apply_gradients(zip(g_gradients, generator.trainable_variables))
                total_g_loss += combined_g_loss.numpy()
                total_d_loss += d_loss_value.numpy()
                num_batches += 1
            
            # Calculate average loss for the epoch
            avg_g_loss = total_g_loss / num_batches
            avg_d_loss = total_d_loss / num_batches

            # Print progress
            if (epoch + 1) % print_interval == 0:
                print(f"Epoch {epoch + 1}, Generator Loss: {avg_g_loss}, Discriminator Loss: {avg_d_loss}")

            # Check if the loss reduction is below the threshold and update learning rates
            if avg_g_loss > min_g_loss * (1 - loss_reduction_threshold):
                lr_generator *= learning_rate_reduction_factor
                non_dp_optimizer = tf.keras.optimizers.Adam(learning_rate=lr_generator)

            if avg_d_loss > min_d_loss * (1 - loss_reduction_threshold):
                lr_discriminator *= learning_rate_reduction_factor
                optimizer = DPGradientDescentOptimizer(dp_sum_query=dp_sum_query, num_microbatches=1, learning_rate=lr_discriminator)

            # Update minimum loss if current average loss is lower
            min_g_loss = min(min_g_loss, avg_g_loss)
            min_d_loss = min(min_d_loss, avg_d_loss)

            # Print current learning rates
            print(f"Current learning rates - Generator: {lr_generator}, Discriminator: {lr_discriminator}")

        # Generate final synthetic data
        synthetic_data = generator.predict(np.random.normal(size=(sample_size, 1)))

        # Apply clipping to the synthetic data
        synthetic_data_clipped = np.clip(synthetic_data, lower_clip, upper_clip)

        synthetic_data_rounded = np.rint(synthetic_data_clipped)

        # Convert the rounded data to integer type
        synthetic_data_integers = synthetic_data_rounded.astype(int)

        return synthetic_data_integers
