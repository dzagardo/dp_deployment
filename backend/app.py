from flask import Flask, request, jsonify, send_file, send_from_directory
import pandas as pd
from opacus import PrivacyEngine
import tensorflow as tf
import io
import logging
from data_synthesizer import generate_private_data
from flask_cors import CORS
import os
import time
from algorithm_registry import AlgorithmRegistry
from algorithms.gaussian_mechanism import GaussianMechanism
from algorithms.laplace_mechanism import LaplaceMechanism

# Register the algorithms
AlgorithmRegistry.register_algorithm("Gaussian Mechanism", GaussianMechanism)
AlgorithmRegistry.register_algorithm("Laplace Mechanism", LaplaceMechanism)

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

@app.route('/')
def home():
    return "Welcome to the Data Privacy Backend!"

def read_csv(file_path):
    try:
        return pd.read_csv(file_path)
    except Exception as e:
        return str(e)

def write_csv(data, file_path):
    try:
        data.to_csv(file_path, index=False)
        return "File saved successfully."
    except Exception as e:
        return str(e)

@app.route('/list_files', methods=['GET'])
def list_files():
    try:
        # List files in the 'data' directory
        files = os.listdir('data')
        # Return the list of files
        return jsonify(files), 200
    except Exception as e:
        logging.error(f"An error occurred while listing the files: {e}")
        return str(e), 500

@app.route('/get_file/<filename>', methods=['GET'])
def get_file(filename):
    file_path = os.path.join('data', filename)
    try:
        if os.path.isfile(file_path):
            return send_file(file_path)
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        logging.error(f"An error occurred while retrieving the file: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/get_ratings/<filename>', methods=['GET'])
def get_ratings(filename):
    file_path = os.path.join('data', filename)
    try:
        if os.path.isfile(file_path):
            data = pd.read_csv(file_path)
            # Assuming 'rating' is the column name for ratings in your CSV file
            ratings = data['rating'].tolist()
            return jsonify(ratings), 200
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        logging.error(f"An error occurred while retrieving the ratings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return "No file part", 400
    
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    
    # Define the path where you want to save the file
    file_save_path = f'data/{file.filename}'
    try:
        # Save the file to the filesystem in the data directory
        file.save(file_save_path)
        logging.info(f"File {file.filename} saved as {file_save_path}")
        return jsonify({"message": "File uploaded successfully", "file_path": file_save_path}), 200
    except Exception as e:
        logging.error(f"An error occurred while saving the file: {e}")
        return str(e), 500

@app.route('/generate_data/<algorithm_name>/<filename>', methods=['POST'])
def generate_data(algorithm_name, filename):
    try:
        logging.info(f"Request to generate data using {algorithm_name} for file {filename}")

        uploaded_file_path = os.path.join('data', filename)
        if not os.path.exists(uploaded_file_path):
            logging.error(f"File does not exist: {filename}")
            return "File does not exist", 400

        logging.info(f"File found: {filename}")

        dp_algorithm = AlgorithmRegistry.get_algorithm(algorithm_name)
        if not dp_algorithm:
            logging.error(f"Algorithm not found in registry: {algorithm_name}")
            raise ValueError(f"Algorithm {algorithm_name} not found in registry")

        logging.info(f"Algorithm retrieved: {algorithm_name}")

        original_data = pd.read_csv(uploaded_file_path)
        sample_size = len(original_data)

        target_epsilon = 1.0
        target_delta = 1e-5

        logging.info("Generating synthetic data...")
        synthetic_data = dp_algorithm.generate_synthetic_data(original_data['rating'].values, sample_size, target_epsilon, target_delta)

        logging.info("Synthetic data generation complete.")

        original_data['rating'] = synthetic_data

        timestamp = time.strftime("%Y%m%d-%H%M%S")
        modified_file_name = f"modified_data_{timestamp}.csv"
        modified_file_path = os.path.join('data', modified_file_name)

        original_data.to_csv(modified_file_path, index=False)
        logging.info(f"Modified data written to {modified_file_path}")

        return jsonify({
            "message": "Data with synthetic ratings generated successfully.",
            "file_path": modified_file_path
        }), 200

    except Exception as e:
        logging.error(f"An error occurred during data generation: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=False)  # Ensure debug mode is set to False here