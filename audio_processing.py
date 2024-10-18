import numpy as np
import soundfile as sf
import librosa
import pyttsx3
import speech_recognition as sr
from cryptography.fernet import Fernet



def speech_to_text(audio_file):
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_file) as source:
            audio_data = recognizer.record(source)
        return recognizer.recognize_google(audio_data)
    except sr.UnknownValueError:
        return "Google Speech Recognition could not understand the audio"
    except sr.RequestError:
        return "Could not request results from Google Speech Recognition service"


def generate_and_save_key():
    key = Fernet.generate_key()
    with open('secret.key', 'wb') as key_file:
        key_file.write(key)
    print("Key generated and saved as 'secret.key'. Please download this file and keep it safe.")


def load_key():
    print("Please upload the 'secret.key' file to use for encryption/decryption:")
    from google.colab import files
    uploaded_key = files.upload()
    key_path = list(uploaded_key.keys())[0]
    with open(key_path, 'rb') as key_file:
        key = key_file.read()
    print("Key loaded successfully.")
    return key



def encrypt_file(file_path, key):
    with open(file_path, 'rb') as file:
        file_data = file.read() 
    fernet = Fernet(key)
    
    encrypted_data = fernet.encrypt(file_data)
    encrypted_file_path = file_path + '.encrypted'
    
    with open(encrypted_file_path, 'wb') as file:
        file.write(encrypted_data)
    
    print(f"File encrypted and saved as '{encrypted_file_path}'.")
    return encrypted_file_path



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
    


def speech_to_text(audio_file):
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_file) as source:
            audio_data = recognizer.record(source)
        return recognizer.recognize_google(audio_data)
    except sr.UnknownValueError:
        return "Google Speech Recognition could not understand the audio"
    except sr.RequestError:
        return "Could not request results from Google Speech Recognition service"


def text_to_speech(text, output_path):
    engine = pyttsx3.init()
    engine.save_to_file(text, output_path)
    engine.runAndWait()


def pitch_shifting(audio_path, n_steps, output_path):
    try:
        y, sr = librosa.load(audio_path, sr=None)
        y_shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=n_steps)
        sf.write(output_path, y_shifted, sr)
    except Exception as e:
        raise Exception(f"Error in pitch shifting: {e}")



def convert_to_female(audio_path, output_path):
    try:
        y, sr = librosa.load(audio_path, sr=None)
        y_shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=4)
        sf.write(output_path, y_shifted, sr)
    except Exception as e:
        print(f"Error in converting to female voice: {e}")


def convert_to_male(audio_path, output_path):
    try:
        y, sr = librosa.load(audio_path, sr=None)
        y_shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=-4)
        sf.write(output_path, y_shifted, sr)
    except Exception as e:
        print(f"Error in converting to male voice: {e}")


def save_audio(audio_data, output_path, sample_rate=16000):
    try:
        sf.write(output_path, audio_data.flatten(), sample_rate)
    except Exception as e:
        print(f"Error in saving audio: {e}")



def process_audio(audio_path, key_path):
    generate_and_save_key()
    key = load_key()
    encrypted_audio_path = encrypt_file(audio_path, key)
    decrypted_audio_path = decrypt_file(encrypted_audio_path, key)

    pitch_shifting(decrypted_audio_path, n_steps=2, output_path='processed_audio.wav')

    convert_to_female(decrypted_audio_path, output_path='female_voice.wav')

