from flask import Flask, request, jsonify, send_file, session
import subprocess
import json
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
app.secret_key = os.urandom(16)  # or a hard-coded secret key
CORS(app, supports_credentials=True)
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
    
@app.route('/get_column_names/<filename>', methods=['GET'])
def get_column_names(filename):
    file_path = os.path.join('data', filename)
    try:
        if os.path.isfile(file_path):
            data = pd.read_csv(file_path)
            column_names = data.columns.tolist()  # Extract column names
            return jsonify(column_names), 200
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        logging.error(f"An error occurred while retrieving column names: {e}")
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
    file_save_path = os.path.join('data', file.filename)
    try:
        # Save the file to the filesystem in the data directory
        file.save(file_save_path)
        logging.info(f"File {file.filename} saved as {file_save_path}")

        # Define dataset details (adjust these details as necessary)
        dataset_details = {
            "name": file.filename,
            "filePath": file_save_path,
            "privacyBudget": 1.0,  # Default or calculated value
            "userId": "clphhvcof0000rrrankn3d4vn"  # Replace with actual user ID
        }

        # Call Node.js script to create a new dataset entry
        result = subprocess.run(
            ['node', '../frontend/scripts/prismaOperations.js', 'createDatasetForUser', json.dumps(dataset_details)],
            capture_output=True, text=True
        )

        if result.returncode != 0:
            # Handle errors from Node.js script
            logging.error("Node.js script error: " + result.stderr)
            return jsonify({"error": "Failed to create dataset entry"}), 500

        # Parse the JSON output from the Node.js script
        dataset = json.loads(result.stdout)
        return jsonify({"message": "File and dataset uploaded successfully", "dataset": dataset}), 200

    except Exception as e:
        logging.error(f"An error occurred while saving the file: {e}")
        return str(e), 500
    
@app.route('/generate_data/<algorithm_name>/<filename>', methods=['POST'])
def generate_data(algorithm_name, filename):
    try:
        logging.info(f"Request to generate data using {algorithm_name} for file {filename}")

        # Parse epsilon, delta, clipping values, and column name from the request data
        data = request.get_json()
        epsilon = data.get('epsilon', 1.0)
        delta = data.get('delta', 1e-5)
        upper_clip = data.get('upper_clip', 5)
        lower_clip = data.get('lower_clip', 0)
        column_name = data.get('column_name')  # This is the new parameter for the column name

        # Sanitize epsilon and delta by replacing dots with underscores
        epsilon_str = str(epsilon).replace('.', '_')
        delta_str = str(delta).replace('.', '_')
        
        if not column_name:
            return jsonify({"error": "Column name not provided"}), 400

        uploaded_file_path = os.path.join('data', filename)
        if not os.path.exists(uploaded_file_path):
            logging.error(f"File does not exist: {filename}")
            return "File does not exist", 400

        logging.info(f"File found: {filename}")
        original_data = pd.read_csv(uploaded_file_path)
        sample_size = len(original_data)


        dp_algorithm = AlgorithmRegistry.get_algorithm(algorithm_name)
        if not dp_algorithm:
            logging.error(f"Algorithm not found in registry: {algorithm_name}")
            raise ValueError(f"Algorithm {algorithm_name} not found in registry")

        logging.info(f"Algorithm retrieved: {algorithm_name}")


        # Make sure the column exists in the data
        if column_name not in original_data.columns:
            return jsonify({"error": f"Column {column_name} not found in data"}), 400

        logging.info("Generating synthetic data...")
        synthetic_data = dp_algorithm.generate_synthetic_data(
            original_data[column_name].values,
            sample_size,
            epsilon,
            delta,
            lower_clip,
            upper_clip
        )

        logging.info("Synthetic data generation complete.")

        # Update the filename to include the algorithm name and clipping values
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        modified_file_name = f"{algorithm_name}_eps{epsilon_str}_delta{delta_str}_lower{lower_clip}_upper{upper_clip}_data_{timestamp}.csv"
        modified_file_path = os.path.join('data', modified_file_name)

        original_data[column_name] = synthetic_data
        original_data.to_csv(modified_file_path, index=False)
        logging.info(f"Modified data written to {modified_file_path}")

        return jsonify({
            "message": "Data with synthetic values generated successfully.",
            "file_path": modified_file_path
        }), 200

    except Exception as e:
        logging.error(f"An error occurred during data generation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/datasets/mean_rating/<dataset_id>/<algorithm_name>', methods=['GET'])
def get_noisy_mean_rating(dataset_id, algorithm_name):
    try:        
        # Parse epsilon, delta, clipping values, and column name from the request data
        data = request.get_json()
        epsilon = data.get('epsilon', 1.0)
        delta = data.get('delta', 1e-5)
        column_name = data.get('column_name')  # This is the new parameter for the column name
        # Retrieve the rating column

        # Retrieve current epsilon (privacy budget) for the dataset
        current_epsilon = get_current_epsilon(dataset_id)

        # Define the sensitivity and delta of your query
        sensitivity = 1  # Set based on your specific dataset and query
        delta = 1e-5  # Set based on your requirements

        # Get the DP algorithm instance from the registry
        dp_algorithm = AlgorithmRegistry.get_algorithm(algorithm_name)

        # Calculate the noisy mean
        noisy_mean = dp_algorithm.generate_noisy_mean(
            data=data[column_name].values,
            epsilon=epsilon,
            delta=delta
        )

        # Deduct the used epsilon from the dataset's privacy budget
        deduct_epsilon(dataset_id, current_epsilon)

        return jsonify(mean_rating=noisy_mean), 200
    except Exception as e:
        return str(e), 500

def get_current_epsilon(dataset_id):
    # Retrieve the current privacy budget for the dataset from the database
    dataset = getDataset(dataset_id)
    return dataset.privacy_budget

def deduct_epsilon(dataset_id, used_epsilon):
    # Deduct the used epsilon from the dataset's privacy budget and update the database
    dataset = getDataset(dataset_id)
    new_epsilon = max(dataset.privacy_budget - used_epsilon, 0)
    update_budget_in_db(dataset_id, new_epsilon)

def is_database_admin():
    user = session.get('user')
    return user is not None and user.get('role') == 'Database Administrator'

def validate_budget(budget):
    try:
        budget = float(budget)  # Ensure the budget can be converted to a float
        # Define acceptable range for the privacy budget, e.g., 0 < budget <= 1
        return 0 < budget <= 1
    except (ValueError, TypeError):
        return False  # Return False if the budget is not a valid number

@app.route('/api/datasets/updatePrivacyBudget/<dataset_id>', methods=['POST'])
def update_privacy_budget(dataset_id):
    try:
        data = request.get_json()
        new_budget = data.get('newBudget')  

        if new_budget is None or not validate_budget(new_budget):
            return "Invalid privacy budget", 400

        update_budget_in_db(dataset_id, new_budget)
        return jsonify({"message": "Privacy budget updated successfully"}), 200

    except Exception as e:
        return str(e), 500


def validate_budget(budget):
    try:
        budget = float(budget)
        return 0 < budget <= 1  # Adjust range as necessary
    except ValueError:
        return False

def update_budget_in_db(dataset_id, new_budget):
    try:
        print(dataset_id)
        print(new_budget)
        # Construct the command to run the Node.js script with the necessary arguments
        command = ['ts-node', '../frontend/scripts/prismaOperations.js', 'updatePrivacyBudgetForDataset', dataset_id, str(new_budget)]

        # Run the Node.js script
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode != 0:
            # If the Node.js script returned an error, log it and return a response
            error_message = "Node.js script error: " + result.stderr
            logging.error(error_message)
            return jsonify({"error": error_message}), 500

        # If the script was successful, parse the output (if needed) and return a success message
        # This assumes your Node.js script returns a confirmation message or the updated dataset
        updated_dataset = json.loads(result.stdout)
        return jsonify({"message": "Privacy budget updated successfully", "dataset": updated_dataset}), 200

    except Exception as e:
        # Log any exceptions that occur and return an error response
        error_message = f"An error occurred during the update: {e}"
        logging.error(error_message)
        return jsonify({"error": error_message}), 500

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    try:
        # Call the Node.js script with the 'listDatasets' command
        result = subprocess.run(['ts-node', '../frontend/scripts/prismaOperations.js', 'listDatasets'], capture_output=True, text=True)

        if result.returncode != 0:
            # Log the error from the Node.js script and return a response
            error_message = "Node.js script error: " + result.stderr
            logging.error(error_message)
            return jsonify({"error": error_message}), 500

        # Parse the JSON output from the Node.js script
        datasets = json.loads(result.stdout)

        return jsonify(datasets), 200

    except Exception as e:
        # Log the detailed exception and return a response
        error_message = f"An error occurred while listing datasets: {e}"
        logging.error(error_message)
        return jsonify({"error": error_message}), 500

if __name__ == '__main__':
    app.run(debug=False)  # Ensure debug mode is set to False here