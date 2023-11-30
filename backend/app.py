from flask import Flask, request, jsonify, send_file
import pandas as pd
from opacus import PrivacyEngine
import tensorflow as tf
import io
import logging
from data_synthesizer import generate_private_data  # Make sure this is the correct import

app = Flask(__name__)
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

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return "No file part"
    
    file = request.files['file']
    if file.filename == '':
        return "No selected file"
    
    data = read_csv(file)
    return jsonify(data.to_dict())

@app.route('/generate_data', methods=['POST'])
def generate_data():
    try:
        if 'file' not in request.files:
            logging.error("No file part in the request")
            return "No file part in the request", 400
        
        file = request.files['file']
        if file.filename == '':
            logging.error("No selected file")
            return "No selected file", 400
        
        uploaded_file_path = 'data/uploaded_data.csv'  # Path for uploaded file
        file.save(uploaded_file_path)
        logging.info(f"File {file.filename} saved as {uploaded_file_path}")

        # Read the uploaded file to determine the number of records
        original_data = pd.read_csv(uploaded_file_path)
        sample_size = len(original_data)  # Set sample_size to the number of records

        # Generate synthetic data
        target_epsilon = 1.0
        target_delta = 1e-5
        epochs = 5

        synthetic_data = generate_private_data(
            uploaded_file_path, sample_size, target_epsilon, target_delta, epochs
        )
        logging.info("Synthetic data generation complete.")

        # Replace the 'rating' column in the original data with synthetic ratings
        original_data['rating'] = synthetic_data

        # Save the modified data
        modified_file_path = 'data/modified_data.csv'
        original_data.to_csv(modified_file_path, index=False)
        logging.info("Modified data with synthetic ratings written to file.")

        return jsonify({
            "message": "Data with synthetic ratings generated successfully.",
            "file_path": modified_file_path
        }), 200
    
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=False)  # Ensure debug mode is set to False here