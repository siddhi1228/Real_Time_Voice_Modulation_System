from flask import Flask, request, jsonify, render_template, send_file, send_from_directory, flash, redirect, url_for ,session
from flask_cors import CORS
from pymongo import MongoClient
import os
import bcrypt
from audio_processing import (
    speech_to_text, text_to_speech, pitch_shifting,
    convert_to_female, convert_to_male, encrypt_file,
    generate_and_save_key, load_key
)
from cryptography.fernet import Fernet
import tempfile

app = Flask(__name__)
CORS(app)

# Set the secret key for the app
app.secret_key = '694df2fe7fd16a3d82a5ef9a55b991d4223e436a684c429a'  # Replace with a strong, unique key

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')  # Adjust the URI as necessary
db = client['login_data']  # Use your database name here
users_collection = db['users']  # Collection for storing user data

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['PROCESSED_FOLDER'] = 'processed'

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
if not os.path.exists(app.config['PROCESSED_FOLDER']):
    os.makedirs(app.config['PROCESSED_FOLDER'])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = users_collection.find_one({'email': email})

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            session['user_name'] = user['name']  # Store the user's name in the session
            flash('Login successful', 'success')  # Set a flash message
            return redirect(url_for('index'))  # Redirect to the index page
        else:
            flash('Invalid email or password', 'error')  # Set a flash message
            return redirect(url_for('login'))  # Redirect back to login page

    return render_template('login.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    if users_collection.find_one({'email': email}):
        return render_template('login.html', error_message='Email already exists')

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = {
        'name': name,
        'email': email,
        'password': hashed_password
    }

    users_collection.insert_one(new_user)

    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.pop('user_name', None)  # Remove the user's name from the session
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))


@app.route('/modulate')
def modulate():
    return render_template('new.html')

@app.route('/audio')
def serve_audio():
    return send_from_directory(app.config['UPLOAD_FOLDER'], 'audio.wav')

@app.route('/generate-key', methods=['GET'])
def generate_key():
    generate_and_save_key()
    return jsonify({'message': 'Key generated successfully', 'file': 'secret.key'})

@app.route('/download-key', methods=['GET'])
def download_key():
    key_path = 'secret.key'
    if os.path.exists(key_path):
        return send_file(key_path, as_attachment=True)
    else:
        return jsonify({'error': 'Key file not found'}), 404

@app.route('/pitch-shift', methods=['GET'])
def pitch_shift_endpoint():
    try:
        n_steps = int(request.args.get('n_steps', 0))  
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], 'audio.wav')

        if not os.path.exists(audio_path):
            return jsonify({'error': 'Audio file not found'}), 404

        output_path = os.path.join(app.config['PROCESSED_FOLDER'], 'processed_audio.wav')
        pitch_shifting(audio_path, n_steps, output_path)

        return jsonify({'success': True, 'message': 'Audio processed successfully', 'file': '/download-processed-audio'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/encrypt-audio', methods=['GET'])
def encrypt_audio_endpoint():
    action = request.args.get('action')
    
    if action == 'encryption-section':
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], 'audio.wav')
        key_path = 'secret.key'
        
        if not os.path.exists(audio_path):
            return jsonify({'error': 'Audio file not found'}), 404
        if not os.path.exists(key_path):
            return jsonify({'error': 'Key is not provided. Please generate or upload a key.'}), 400

        try:
            with open(key_path, 'rb') as key_file:
                key = key_file.read()
            
            encrypted_file_path = encrypt_file(audio_path, key)
            
            return send_file(
                encrypted_file_path,
                mimetype='application/octet-stream',
                as_attachment=True,
                download_name='encrypted_audio.encrypted'
            )
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid action'}), 400

def decrypt_file(encrypted_file_path, fernet):
    decrypted_file_path = tempfile.mktemp(suffix='.wav')
    try:
        with open(encrypted_file_path, 'rb') as enc_file:
            encrypted_data = enc_file.read()
        
        decrypted_data = fernet.decrypt(encrypted_data)
        
        with open(decrypted_file_path, 'wb') as dec_file:
            dec_file.write(decrypted_data)
    
    except Exception as e:
        raise Exception(f"Error during file decryption: {e}")
    
    return decrypted_file_path

@app.route('/decrypt-audio', methods=['GET'])
def decrypt_audio_endpoint():
    action = request.args.get('action')

    if action == 'decryption-section':
        encrypted_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'audio.wav.encrypted')
        key_path = 'secret.key'
        
        if not os.path.exists(encrypted_file_path):
            return jsonify({'error': 'Encrypted file not found'}), 404
        if not os.path.exists(key_path):
            return jsonify({'error': 'Key is not provided. Please generate or upload a key.'}), 400

        try:
            with open(key_path, 'rb') as key_file:
                key = key_file.read().strip()
            
            fernet = Fernet(key)
            decrypted_file_path = decrypt_file(encrypted_file_path, fernet)
            
            return send_file(
                decrypted_file_path,
                mimetype='application/octet-stream',
                as_attachment=True,
                download_name='decrypted_audio.wav'
            )
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid action'}), 400

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'})

    file = request.files['audio']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'})

    filename = file.filename
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    return jsonify({'success': True, 'filename': filename})

@app.route('/process-audio', methods=['GET'])
def process_audio():
    action = request.args.get('action')  
    
    if action == 'speech_to_text':
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], 'audio.wav')
        
        if os.path.exists(audio_path):
            result = speech_to_text(audio_path)
            return jsonify({'success': True, 'text': result})
        else:
            return jsonify({'success': False, 'error': 'Audio file not found'})

@app.route('/download-processed-audio', methods=['GET'])
def download_processed_audio():
    file_path = os.path.join(app.config['PROCESSED_FOLDER'], 'processed_audio.wav')
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name='processed_audio.wav')
    else:
        return jsonify({'error': 'File not found'}), 404

if __name__ == "__main__":
    app.run(debug=True)
