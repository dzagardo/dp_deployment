# dp_gan.py

import numpy as np
import tensorflow as tf
from tensorflow_privacy.privacy.optimizers.dp_optimizer import DPGradientDescentOptimizer
from tensorflow_privacy.privacy.dp_query.gaussian_query import GaussianSumQuery
from tensorflow_privacy.privacy.analysis.compute_dp_sgd_privacy_lib import compute_dp_sgd_privacy_statement
from tensorflow_privacy.privacy.analysis.compute_noise_from_budget_lib import compute_noise

from algorithms.dp_algorithm import DPAlgorithm

class DPGAN(DPAlgorithm):
    def build_generator(self):
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_dim=1),
            tf.keras.layers.LeakyReLU(alpha=0.01),
            tf.keras.layers.Dense(256, activation='relu'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dense(1, activation='linear')  # Linear activation
        ])
        return model

    def build_discriminator(self):
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(512, activation='relu', input_dim=1),  # Input dimension is 1 (for one rating)
            tf.keras.layers.Dense(256, activation='relu'),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dense(1, activation='sigmoid')  # Output is a probability
        ])
        return model

    @staticmethod
    def discriminator_loss(labels, predictions):
        loss = tf.keras.losses.BinaryCrossentropy(from_logits=False)(labels, predictions)
        return loss

    @staticmethod
    def generator_loss(fake_output):
        return tf.keras.losses.BinaryCrossentropy(from_logits=False)(tf.ones_like(fake_output), fake_output)
    
    def generate_synthetic_data(self, data, sample_size, epsilon, delta, lower_clip, upper_clip):
        epochs = 25
        batch_size = 100
        noise_dim = 1
        print_interval = 1
        # Convert data to TensorFlow Dataset
        data = tf.data.Dataset.from_tensor_slices(data).batch(batch_size)
        number_of_examples = len(data)

        # Calculate noise multiplier
        noise_multiplier = compute_noise(number_of_examples, batch_size, epsilon, epochs, delta, noise_lbd=1e-5)

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
            max_examples_per_user=None,  # Assuming no limit on examples per user
        )
        print(privacy_statement)

        # Build the generator and discriminator
        generator = self.build_generator()
        discriminator = self.build_discriminator()
        dp_sum_query = GaussianSumQuery(l2_norm_clip, noise_multiplier)

        # Differential Privacy Optimizer
        optimizer = DPGradientDescentOptimizer(
            dp_sum_query=dp_sum_query,
            num_microbatches=1,
            learning_rate=0.01
        )

        # Non-DP optimizer for the generator
        non_dp_optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)


        # Compile the discriminator with the DP optimizer
        discriminator.compile(optimizer=optimizer, loss='binary_crossentropy')

        # Assuming that `optimizer` is the DP optimizer for the discriminator
        # and `non_dp_optimizer` is a standard optimizer for the generator

        # GAN training loop
        for epoch in range(epochs):  # Number of epochs
            for real_data in data:
                # Reshape real_data if it is 1-dimensional
                if len(real_data.shape) == 1:
                    real_data = tf.expand_dims(real_data, axis=-1)

                # Ensure real_data is a float32 tensor if it's not already
                real_data = tf.cast(real_data, tf.float32)

                # Determine current batch size (may be smaller than the fixed batch size for the last batch in data)
                current_batch_size = tf.shape(real_data)[0]

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
                with tf.GradientTape() as disc_tape:
                    discriminator_output = discriminator(combined_data, training=True)
                    d_loss = self.discriminator_loss(labels_combined, discriminator_output)
                    d_loss_value = self.discriminator_loss(labels_combined, discriminator_output)
                    d_gradients = optimizer.compute_gradients(d_loss, discriminator.trainable_variables, gradient_tape=disc_tape)
                    

                # Apply gradients through DP optimizer
                optimizer.apply_gradients(d_gradients)

                # Train the generator
                with tf.GradientTape() as gen_tape:
                    synthetic_data = generator(noise, training=True)
                    predictions = discriminator(synthetic_data, training=False)  # Notice training=False
                    g_loss = self.generator_loss(predictions)

                # Compute and apply gradients through standard optimizer
                g_gradients = gen_tape.gradient(g_loss, generator.trainable_variables)
                non_dp_optimizer.apply_gradients(zip(g_gradients, generator.trainable_variables))

                # Print progress
                if (epoch + 1) % print_interval == 0:
                    print(f"Epoch {epoch + 1}, Generator Loss: {g_loss}, Discriminator Loss: {d_loss_value}")

        # Generate final synthetic data
        synthetic_data = generator.predict(np.random.normal(size=(sample_size, 1)))

        # Scale output from (-1, 1) to (1, 5)
        # synthetic_data_scaled = (synthetic_data + 1) * 2  # This transforms the range from (-1, 1) to (1, 5)

        # Apply clipping to the synthetic data
        synthetic_data_clipped = np.clip(synthetic_data, lower_clip, upper_clip)

        synthetic_data_rounded = np.rint(synthetic_data_clipped)

        return synthetic_data_rounded