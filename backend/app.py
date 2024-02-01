import uuid
from flask import Flask, request, jsonify, send_file, session
import subprocess
import json
import pandas as pd
import numpy as np
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
from algorithms.dp_gan import DPGAN
from algorithms.dp_gan_images import DPGANImages
from algorithms.laplace_mechanism import LaplaceMechanism
from PIL import Image
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
import base64
from flask_socketio import SocketIO, emit
from time import sleep
from google.oauth2 import service_account
from googleapiclient import discovery

### DP ALGORITHM REGISTRY ###
# Register the algorithms
AlgorithmRegistry.register_algorithm("Gaussian Mechanism", GaussianMechanism)
AlgorithmRegistry.register_algorithm("DP-GAN", DPGAN)
AlgorithmRegistry.register_algorithm("DP-GAN Images", DPGANImages)
AlgorithmRegistry.register_algorithm("Laplace Mechanism", LaplaceMechanism)

### BACKEND SERVER ###
app = Flask(__name__)
app.secret_key = os.urandom(16)  # or a hard-coded secret key

# Enable CORS for all routes if necessary
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Initialize SocketIO with CORS enabled
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

logging.basicConfig(level=logging.INFO)

### CHATBOT ###
model_name = "dzagardo/tiny-llama-orca-amp-gclip-dp-pa-sgd-dz-v1.1.1000"
model = AutoModelForCausalLM.from_pretrained(model_name)

# Load tokenizer (assuming you are using the same tokenizer)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Set device to GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize pipeline with your model
pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, device=device)

# model = AutoModelForCausalLM.from_pretrained("./path_to_saved_model")
# tokenizer = AutoTokenizer.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0")
# device = "cuda" if torch.cuda.is_available() else "cpu"
# pipe = pipeline("text-generation", model="TinyLlama/TinyLlama-1.1B-Chat-v1.0", device=device)

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

# Function to convert image to base64
def image_to_base64(image: np.ndarray) -> str:
    pil_image = Image.fromarray(image)
    buffered = io.BytesIO()
    pil_image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str

@app.route('/get_train_images/<filename>', methods=['GET'])
def get_train_images(filename):
    file_path = os.path.join('data', filename)
    try:
        if os.path.exists(file_path):
            images = np.load(file_path)[:50]  # Modify this line
            images_base64 = [image_to_base64(img) for img in images]
            return jsonify(images_base64)
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_train_labels/<filename>', methods=['GET'])
def get_train_labels(filename):
    file_path = os.path.join('data', filename)
    try:
        if os.path.exists(file_path):
            labels = np.load(file_path)[:50]  # Modify this line
            return jsonify(labels.tolist())
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_test_images/<filename>', methods=['GET'])
def get_test_images(filename):
    file_path = os.path.join('data', filename)
    try:
        if os.path.exists(file_path):
            images = np.load(file_path)[:50]  # Modify this line
            images_base64 = [image_to_base64(img) for img in images]
            return jsonify(images_base64)
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_test_labels/<filename>', methods=['GET'])
def get_test_labels(filename):
    file_path = os.path.join('data', filename)
    try:
        if os.path.exists(file_path):
            labels = np.load(file_path)[:50]  # Modify this line
            return jsonify(labels.tolist())
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_column_names/<filename>', methods=['GET'])
def get_column_names(filename):
    try:
        file_path = os.path.join('./data/', filename)

        if os.path.isfile(file_path):
            data = pd.read_csv(file_path)
            column_names = data.columns.tolist()  # Extract column names
            return jsonify(column_names), 200
        else:
            print("File not found:", file_path)
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
    try:
        if 'file' not in request.files:
            return "No file part", 400

        file = request.files['file']
        if file.filename == '':
            return "No selected file", 400

        # Define the directory where you want to save the file
        save_directory = 'data'
        name, ext = os.path.splitext(file.filename)
        
        # Initialize the counter and unique filename
        counter = 1
        unique_filename = f"{name}{ext}"

        # Define the path where you want to save the file
        file_save_path = os.path.join(save_directory, unique_filename)

        # Loop to find a filename that is not already taken
        while os.path.exists(file_save_path):
            unique_filename = f"{name}({counter}){ext}"
            file_save_path = os.path.join(save_directory, unique_filename)
            counter += 1

        # Save the file to the filesystem in the data directory
        file.save(file_save_path)
        logging.info(f"File {file.filename} saved as {file_save_path}")

        # Flask backend pseudo-code
        return jsonify({
            "message": "File uploaded successfully",
            "fileName": unique_filename,  # The actual saved file name
            "filePath": file_save_path
        }), 200

    except Exception as e:
        logging.error(f"An error occurred while processing the file: {str(e)}")
        return str(e), 500
    
@app.route('/generate_data/<algorithm_name>/<filename>', methods=['POST'])
def generate_data(algorithm_name, filename):
    try:
        logging.info(f"Request to generate data using {algorithm_name} for file {filename}")

        # Parse epsilon, delta, clipping values, and column name from the request data
        data = request.get_json()
        print("data is: ", data)
        epsilon = data.get('epsilon', 1.0)
        delta = data.get('delta', 1e-5)
        lower_clip = data.get('lowerClip', 0)
        upper_clip = data.get('upperClip', 5)
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

        print("synthetic data is: ", synthetic_data)

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
            "file_path": modified_file_path,
            "file_name": modified_file_name
        }), 200

    except Exception as e:
        logging.error(f"An error occurred during data generation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate_image_data/<algorithm_name>', methods=['POST'])
def generate_image_data(algorithm_name):
    try:
        logging.info(f"Request to generate data using {algorithm_name}")

        # Parse request data
        data = request.get_json()
        epsilon = data.get('epsilon', 1.0)
        delta = data.get('delta', 1e-5)
        lower_clip = data.get('lowerClip', 0)
        upper_clip = data.get('upperClip', 5)
        train_images_file = data.get('trainImages')
        train_labels_file = data.get('trainLabels')
        test_images_file = data.get('testImages')
        test_labels_file = data.get('testLabels')

        # Validate the file paths
        if not all([train_images_file, train_labels_file, test_images_file, test_labels_file]):
            logging.error("One or more file paths are missing")
            return jsonify({"error": "One or more file paths are missing"}), 400

        dp_algorithm = AlgorithmRegistry.get_algorithm(algorithm_name)
        if not dp_algorithm:
            logging.error(f"Algorithm not found in registry: {algorithm_name}")
            raise ValueError(f"Algorithm {algorithm_name} not found in registry")

        logging.info(f"Algorithm retrieved: {algorithm_name}")

        # Assuming these are file paths, you need to load the data from these files
        # Here's a simplified example, your actual loading will depend on your file format
        train_images = load_images(train_images_file)
        train_labels = load_labels(train_labels_file)
        test_images = load_images(test_images_file)
        test_labels = load_labels(test_labels_file)

        # Assume you have the same number of images and labels
        sample_size = len(train_images)

        # Load only train images and labels
        train_images = load_images(train_images_file)
        train_labels = load_labels(train_labels_file)

        # Generate synthetic data
        synthetic_train_images, synthetic_train_labels = dp_algorithm.generate_synthetic_data(
            train_images, train_labels, 100, epsilon, delta, lower_clip, upper_clip
        )

        # Save only train images and labels
        save_paths = save_synthetic_data(synthetic_train_images, synthetic_train_labels)

        # Prepare response with only train data paths
        response_data = {
            "message": "Synthetic train image data generated successfully.",
            "train_images_path": save_paths['train_images_dir'],
            "train_labels_file": save_paths['train_labels_file']
        }

        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

def save_synthetic_data(synthetic_train_images, synthetic_train_labels):
    # Define the directories for saving the data
    train_images_dir = 'data/train_images'
    train_labels_dir = 'data/train_labels.csv'

    # Create the directories if they don't exist
    os.makedirs(train_images_dir, exist_ok=True)

    # Save train images and labels
    train_labels_list = []
    for index, (image, label) in enumerate(zip(synthetic_train_images, synthetic_train_labels)):
        try:
            # Reshape image if it's grayscale
            if image.shape[-1] == 1:
                image = image.reshape(image.shape[0], image.shape[1])

            # Convert to PIL image and save
            img = Image.fromarray(image.astype(np.uint8))
            img.save(os.path.join(train_images_dir, f'train_image_{index}.png'))
            train_labels_list.append({'id': index, 'label': label})
        except Exception as e:
            print(f"Error saving image {index}: {e}")
    
    # Save train labels to CSV
    pd.DataFrame(train_labels_list).to_csv(train_labels_dir, index=False)

    # Return only the paths for train images and labels
    return {
        'train_images_dir': train_images_dir,
        'train_labels_file': train_labels_dir
    }

def load_images(file_path):
    """
    Load images from a .npy file.

    Parameters:
    file_path (str): The path to the .npy file containing the images.

    Returns:
    np.array: An array of images loaded from the .npy file.
    """

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"The file {file_path} does not exist.")

    # Load the images from the .npy file
    images = np.load(file_path)

    return images

def load_labels(file_path):
    """
    Load labels from a .npy file.

    Parameters:
    file_path (str): Path to the .npy file containing labels.

    Returns:
    numpy.ndarray: Array of labels.
    """
    try:
        labels = np.load(file_path)
        return labels
    except Exception as e:
        logging.error(f"Failed to load labels from {file_path}: {e}")
        raise

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

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    data_directory = './data'
    try:
        # List all files in the data directory
        datasets = [f for f in os.listdir(data_directory) if os.path.isfile(os.path.join(data_directory, f))]
        return jsonify(datasets), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/rename_file', methods=['POST'])
def rename_file():
    try:
        data = request.get_json()
        original_file_path = data.get('original_file_path')
        new_file_name = data.get('new_file_name')

        if not original_file_path or not new_file_name:
            logging.error(f"Missing data: original_file_path={original_file_path}, new_file_name={new_file_name}")
            return jsonify({"error": "Missing data for original file path or new file name"}), 400

        original_full_path = os.path.join(original_file_path)
        new_full_path = os.path.join('./data/', new_file_name)

        logging.info(f"Attempting to rename: {original_full_path} to {new_full_path}")

        if os.path.exists(original_full_path):
            os.rename(original_full_path, new_full_path)
            logging.info(f"File renamed from {original_full_path} to {new_full_path}")
            return jsonify({"message": "File renamed successfully", "new_file_path": new_full_path}), 200
        else:
            logging.error(f"Original file does not exist: {original_full_path}")
            return jsonify({"error": "Original file does not exist"}), 404

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/delete_file', methods=['POST'])
def delete_file():
    try:
        # Extracting data from the request
        data = request.get_json()
        original_file_path = data.get('original_file_path')
        original_file_name = data.get('original_file_name')

        if not original_file_path:
            logging.error(f"Missing data: original_file_path={original_file_path}")
            return jsonify({"error": "Missing data for original file path"}), 400

        # Constructing the full path to the file
        full_file_path = os.path.join("./data/", original_file_name)

        logging.info(f"Attempting to delete: {full_file_path}")

        # Checking if the file exists and deleting it
        if os.path.exists(full_file_path):
            os.remove(full_file_path)
            logging.info(f"File {full_file_path} deleted successfully")
            return jsonify({"message": "File deleted successfully"}), 200
        else:
            logging.error(f"File does not exist: {full_file_path}")
            return jsonify({"error": "File does not exist"}), 404

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

def calculate_sensitivity(data, column):
    """Calculate the global sensitivity for the mean."""
    max_value = data[column].max()
    min_value = data[column].min()
    num_records = len(data)
    return (max_value - min_value) / num_records

def determine_epsilon(total_queries, privacy_budget, base_epsilon=0.1, risk_tolerance=0.5):
    """Dynamically determine epsilon based on operational parameters."""
    epsilon_decay = base_epsilon / total_queries  # Adjust epsilon based on the total number of queries
    epsilon_budget_adjusted = privacy_budget * risk_tolerance  # Adjust epsilon based on the remaining privacy budget and risk tolerance
    return min(epsilon_decay, epsilon_budget_adjusted)  # Choose the smaller epsilon for stronger privacy

def calculate_noisy_statistic(data, column, epsilon, operation):
    """Apply differential privacy noise based on the operation."""
    sensitivity = calculate_sensitivity(data, column) if operation in ['mean', 'median'] else 1
    actual_value = getattr(data[column], operation)() if operation != 'mode' else data[column].mode()[0]
    noise = np.random.laplace(0, sensitivity/epsilon)  # Apply noise based on sensitivity
    return actual_value + noise

@app.route('/get_noisy/<operation>', methods=['POST'])
def get_noisy_statistic(operation):
    data = request.json
    privacy_budget = float(data['privacyBudget'])
    file_name = data['fileName']
    column_name = data['columnName']
    total_queries = data['totalQueries']

    file_path = os.path.join('data', file_name)
    df = pd.read_csv(file_path)

    print(data)
    print(column_name)
    try:
        # Dynamically determine epsilon
        epsilon_used = determine_epsilon(total_queries, privacy_budget)

        # Ensure that the epsilon used does not exceed the remaining privacy budget
        if epsilon_used > privacy_budget:
            return jsonify({"error": "Not enough privacy budget"}), 400

        statistic_value = calculate_noisy_statistic(df, column_name, epsilon_used, operation)
        new_privacy_budget = max(privacy_budget - epsilon_used, 0)

        print(f"Privacy loss (epsilon reduction): {epsilon_used}")

        return jsonify({
            "updatedPrivacyBudget": new_privacy_budget,
            "statisticValue": statistic_value
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/chat', methods=['POST'])
def chat():
    # Start the WebSocket event, this will be picked up by the 'message' event handler
    return jsonify({'reply': "WebSocket event started"})

@socketio.on('message')
def handle_message(data):
    user_message = data['message']
    
    # Process the user_message just like before
    messages = [
        {"role": "system", "content": "You are a friendly AI assistant."},
        {"role": "user", "content": user_message},
    ]
    # Apply chat template
    prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    # Generate a response using the pipeline
    outputs = pipe(prompt, max_new_tokens=256, do_sample=True, temperature=0.7, top_k=50, top_p=0.95)
    full_response = outputs[0]["generated_text"]
    reply_parts = full_response.split("<|assistant|>")
    chatbot_reply = reply_parts[-1].strip() if len(reply_parts) > 1 else full_response.strip()
    emit('response', {'word': '<NEW_MESSAGE>'})  # Start of a new message
    for char in chatbot_reply:  # Iterate through characters instead of words
        emit('response', {'char': char})  # Emit the character
        sleep(0.01)

if __name__ == '__main__':
    socketio.run(app, debug=True)

@app.route('/run-code', methods=['POST'])
def run_code():
    data = request.json  # Or request.form if sent as form data
    selectedComputeZone = data.get('selectedComputeZone')
    selectedMachineType = data.get('selectedMachineType')
    numEpochs = data.get('numEpochs')
    gradAccum = data.get('gradAccum')
    sampleSize = data.get('sampleSize')
    microBatchSize = data.get('microBatchSize')
    learningRate = data.get('learningRate')
    batchSize = data.get('batchSize')
    selectedModel = data.get('selectedModel')
    selectedDataset = data.get('selectedDataset')
    selectedOptimizer = data.get('selectedOptimizer')
    modelSource = data.get('modelSource')
    datasetSource = data.get('datasetSource')

    # Load your service account credentials
    credentials = service_account.Credentials.from_service_account_file(
        './credentials/service-account-file.json'
    )
    # Build a client to the GCP service you are using (e.g., Compute Engine)
    service = discovery.build('compute', 'v1', credentials=credentials)

    # Configure the VM or job parameters based on the POST request data
    project = 'privacytoolbox'
    zone = 'selectedComputeZone'
    selectedMachineType = 'selectedComputeZone'
    instance_body = {
        "name": "instance-name",  # Name of the VM instance
        "machineType": f"zones/{selectedComputeZone}/machineTypes/{selectedMachineType}",  # Path to the machine type
        "disks": [
            {
                "boot": True,
                "initializeParams": {
                    "sourceImage": "projects/debian-cloud/global/images/family/debian-10",  # Path to the disk image
                }
            }
        ],
        "networkInterfaces": [
            {
                "network": "global/networks/default",
                "accessConfigs": [
                    {
                        "type": "ONE_TO_ONE_NAT",
                        "name": "External NAT"
                    }
                ]
            }
        ],
        "serviceAccounts": [
            {
                "email": "1078644946420-compute@developer.gserviceaccount.com",  # Service account email
                "scopes": [
                    "https://www.googleapis.com/auth/cloud-platform"
                ]
            }
        ],
        # Specify any metadata that you need to pass to the instance for your training job
        "metadata": {
            "items": [
                {
                    "key": "startup-script",
                    "value": f"""
                    #!/bin/bash
                    # Commands to install dependencies, set up environment, etc.
                    # Clone your repository or pull your training code
                    # Run your training script with the provided parameters
                    python train.py --num_epochs={numEpochs} --grad_accum={gradAccum} --sample_size={sampleSize} --micro_batch_size={microBatchSize} --learning_rate={learningRate} --batch_size={batchSize} --model={selectedModel} --dataset={selectedDataset} --optimizer={selectedOptimizer}
                    """
                }
            ]
        }
    }

    # Call the GCP API to start a new VM instance
    request = service.instances().insert(project=project, zone=zone, body=instance_body)
    response = request.execute()

    # You can handle the response here
    return 'Job submitted', 200