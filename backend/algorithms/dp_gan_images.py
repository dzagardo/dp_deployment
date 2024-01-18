# dp_gan.py

import numpy as np
import tensorflow as tf
from tensorflow_privacy.privacy.optimizers.dp_optimizer import DPGradientDescentOptimizer
from tensorflow_privacy.privacy.dp_query.gaussian_query import GaussianSumQuery
from tensorflow_privacy.privacy.analysis.compute_dp_sgd_privacy_lib import compute_dp_sgd_privacy_statement
from tensorflow_privacy.privacy.analysis.compute_noise_from_budget_lib import compute_noise
import tensorflow_probability as tfp

from algorithms.dp_algorithm import DPAlgorithm

class DPGANImages(DPAlgorithm):
    def build_cnn_generator(self):
        model = tf.keras.Sequential()
        model.add(tf.keras.layers.Dense(7*7*256, use_bias=False, input_shape=(100,)))
        model.add(tf.keras.layers.BatchNormalization())
        model.add(tf.keras.layers.LeakyReLU())
        
        model.add(tf.keras.layers.Reshape((7, 7, 256)))
        # Upsample to 14x14
        model.add(tf.keras.layers.Conv2DTranspose(128, (5, 5), strides=(1, 1), padding='same', use_bias=False))
        model.add(tf.keras.layers.BatchNormalization())
        model.add(tf.keras.layers.LeakyReLU())

        # Upsample to 28x28
        model.add(tf.keras.layers.Conv2DTranspose(64, (5, 5), strides=(2, 2), padding='same', use_bias=False))
        model.add(tf.keras.layers.BatchNormalization())
        model.add(tf.keras.layers.LeakyReLU())

        model.add(tf.keras.layers.Conv2DTranspose(1, (5, 5), strides=(2, 2), padding='same', use_bias=False, activation='tanh'))
        return model

    def build_cnn_discriminator(self):
        model = tf.keras.Sequential()
        model.add(tf.keras.layers.Conv2D(64, (5, 5), strides=(2, 2), padding='same', input_shape=[28, 28, 1]))
        model.add(tf.keras.layers.LeakyReLU())
        model.add(tf.keras.layers.Dropout(0.3))

        model.add(tf.keras.layers.Conv2D(128, (5, 5), strides=(2, 2), padding='same'))
        model.add(tf.keras.layers.LeakyReLU())
        model.add(tf.keras.layers.Dropout(0.3))

        model.add(tf.keras.layers.Flatten())
        model.add(tf.keras.layers.Dense(1, activation='sigmoid'))
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

    def generate_synthetic_labels(self, labels, sample_size):
        # Implement logic to generate synthetic labels
        # This is a placeholder, replace with your actual logic
        synthetic_labels = np.random.choice(labels, size=sample_size)
        return synthetic_labels
    
    def post_process_images(self, images):
        # Assuming images are in the range [-1, 1]
        # Convert to range [0, 255] and change dtype to uint8
        images = ((images + 1) * 127.5).astype(np.uint8)
        return images
    
    def generate_synthetic_data(self, train_images, train_labels, sample_size, epsilon, delta, lower_clip, upper_clip):
        # Normalize the images to [-1, 1] range as we use tanh activation in the last layer of the generator
        train_images = (train_images - 127.5) / 127.5
        # Convert to appropriate tensor shape
        train_images = np.expand_dims(train_images, axis=-1)
        
        # Hyperparameters
        epochs = 10
        batch_size = 256
        noise_dim = 100
        log_interval = 10

        # Build the generator and discriminator
        generator = self.build_cnn_generator()
        discriminator = self.build_cnn_discriminator()

        # Optimizers
        generator_optimizer = tf.keras.optimizers.Adam(1e-4)
        discriminator_optimizer = tf.keras.optimizers.Adam(1e-4)

        # Loss function
        cross_entropy = tf.keras.losses.BinaryCrossentropy()

        # Training loop
        for epoch in range(epochs):
            for batch_index, image_batch in enumerate(tf.data.Dataset.from_tensor_slices(train_images).batch(batch_size)):
                # Start with discriminator training
                noise = tf.random.normal([batch_size, noise_dim])
                with tf.GradientTape() as disc_tape:
                    generated_images = generator(noise, training=True)
                    real_output = discriminator(image_batch, training=True)
                    fake_output = discriminator(generated_images, training=True)

                    real_loss = cross_entropy(tf.ones_like(real_output), real_output)
                    fake_loss = cross_entropy(tf.zeros_like(fake_output), fake_output)
                    disc_loss = real_loss + fake_loss

                gradients_of_discriminator = disc_tape.gradient(disc_loss, discriminator.trainable_variables)
                discriminator_optimizer.apply_gradients(zip(gradients_of_discriminator, discriminator.trainable_variables))

                # Generator training
                with tf.GradientTape() as gen_tape:
                    generated_images = generator(noise, training=True)
                    fake_output = discriminator(generated_images, training=True)
                    gen_loss = cross_entropy(tf.ones_like(fake_output), fake_output)

                gradients_of_generator = gen_tape.gradient(gen_loss, generator.trainable_variables)
                generator_optimizer.apply_gradients(zip(gradients_of_generator, generator.trainable_variables))

                # Log the progress (optional)
                if batch_index % log_interval == 0:
                    print(f'Epoch {epoch+1}/{epochs}, Batch {batch_index}, Gen Loss: {gen_loss.numpy()}, Disc Loss: {disc_loss.numpy()}')

        # Placeholder for generating synthetic labels (you'll need to implement this)
        synthetic_train_labels = self.generate_synthetic_labels(train_labels, sample_size)
        
        # After training is complete, generate synthetic images
        noise = tf.random.normal([sample_size, noise_dim])
        synthetic_train_images = generator(noise, training=False).numpy()

        # Generate labels for synthetic images
        synthetic_train_labels = self.generate_synthetic_labels(train_labels, sample_size)

        synthetic_train_images = self.post_process_images(synthetic_train_images)

        # Return only train images and labels
        return synthetic_train_images, synthetic_train_labels