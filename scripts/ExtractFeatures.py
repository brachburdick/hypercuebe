import librosa
import numpy as np
import json
import sys

def numpy_to_list(obj):
    """
    Recursively convert numpy arrays to lists for JSON serialization.
    
    Args:
    obj: The object to convert
    
    Returns:
    The converted object
    """
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: numpy_to_list(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [numpy_to_list(item) for item in obj]
    return obj


def load_audio(file_path, sr=44100):
    """
    Load an audio file.
    
    Args:
    file_path (str): Path to the audio file
    sr (int): Sample rate (default: 44100)
    
    Returns:
    tuple: (audio time series, sample rate)
    """
    # print(json.dumps({"msg":"loading audio file", "file_path": file_path}))

    return librosa.load(file_path, sr=sr)

def analyze_rhythm(y, sr):
    """
    Analyze rhythm-related features.
    
    Args:
    y (np.ndarray): Audio time series
    sr (int): Sample rate
    
    Returns:
    dict: Rhythm-related features
    """
    # print(json.dumps({"log":"analyzing rhythm"}))
    # Tempo and beat frames
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    
    # Onset strength
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)

    # print(json.dumps({"log":"successfully analyzed rhythm"}))
    # # print(json.dumps("tempo:", tempo)
    # # print(json.dumps("beat frames:", beat_frames)
    # # print(json.dumps("onset strength:", onset_env)

    return {
        "tempo": tempo,
        "beat_frames": beat_frames,
        "onset_strength": onset_env
    }

def analyze_spectral(y, sr):
    """
    Analyze spectral features.
    
    Args:
    y (np.ndarray): Audio time series
    sr (int): Sample rate
    
    Returns:
    dict: Spectral features
    """
    # print(json.dumps({"log":"analyzing spectral features"}))

    # MFCCs
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    
    # Spectral centroid
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    
    # Spectral bandwidth
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    
    # Spectral contrast
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    
    # Spectral flatness
    flatness = librosa.feature.spectral_flatness(y=y)

    # print(json.dumps({"log":"successfully analyzed spectral features"}))
    # # print(json.dumps("mfccs:", mfccs)
    # # print(json.dumps("spectral centroid:", centroid)
    # # print(json.dumps("spectral bandwidth:", bandwidth)
    # # print(json.dumps("spectral contrast:", contrast)
    # # print(json.dumps("spectral flatness:", flatness)  

    return {
        "mfccs": mfccs,
        "spectral_centroid": centroid,
        "spectral_bandwidth": bandwidth,
        "spectral_contrast": contrast,
        "spectral_flatness": flatness
    }

def analyze_rhythm_patterns(y, sr):
    """
    Analyze rhythm patterns and histogram.
    
    Args:
    y (np.ndarray): Audio time series
    sr (int): Sample rate
    
    Returns:
    dict: Rhythm patterns and histogram
    """
    # print(json.dumps({"log":"analyzing rhythm patterns"}))
    # Compute mel spectrogram
    S = librosa.feature.melspectrogram(y=y, sr=sr)
    # Compute rhythm patterns (you may need to implement this yourself)
    # This is a placeholder and might not be accurate
    rhythm_patterns = librosa.feature.tempogram(onset_envelope=librosa.onset.onset_strength(S=librosa.power_to_db(S)), sr=sr)
    # print(json.dumps({"log":"successfully analyzed rhythm patterns"}))
    # Compute rhythm histogram
    rhythm_histogram = np.sum(rhythm_patterns, axis=1)

    # print(json.dumps({"log":"successfully computed rhythm histogram"}))
    # # print(json.dumps("rhythm patterns:", rhythm_patterns)
    # # print(json.dumps("rhythm histogram:", rhythm_histogram)

    return {
        "rhythm_patterns": rhythm_patterns,
        "rhythm_histogram": rhythm_histogram
    }

def analyze_harmonic(y, sr):
    """
    Analyze harmonic features.
    
    Args:
    y (np.ndarray): Audio time series
    sr (int): Sample rate
    
    Returns:
    dict: Harmonic features
    """
    # print(json.dumps({"log":"analyzing harmonic features"}))
    # Chroma features
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    
    # Tonnetz
    tonnetz = librosa.feature.tonnetz(y=y, sr=sr)

    # print(json.dumps({"log":"successfully analyzed harmonic features"}))
    # # print(json.dumps("chroma:", chroma)
    # # print(json.dumps("tonnetz:", tonnetz)

    return {
        "chroma": chroma,
        "tonnetz": tonnetz
    }

def analyze_high_level(y, sr):
    """
    Analyze high-level features.
    
    Args:
    y (np.ndarray): Audio time series
    sr (int): Sample rate
    
    Returns:
    dict: High-level features
    """
    # print(json.dumps({"log":"analyzing high level features"}))
    # Estimate key
    key = librosa.feature.key(y=y, sr=sr)
    
    # Estimate mode (major/minor)
    mode = librosa.feature.zero_crossing_rate(y)  # This is not accurate, just a placeholder

    # print(json.dumps({"log":"successfully analyzed high level features"}))

    return {
        "estimated_key": key,
        "mode": "major" if np.mean(mode) > 0.5 else "minor"  # This is a very simplistic approach
    }

def analyze_audio(file_path):
    """
    Analyze an audio file and extract all features.
    
    Args:
    file_path (str): Path to the audio file
    
    Returns:
    dict: All extracted features
    """
    y, sr = load_audio(file_path)
    
    features = {
        "rhythm": analyze_rhythm(y, sr),
        "spectral": analyze_spectral(y, sr),
        "rhythm_patterns": analyze_rhythm_patterns(y, sr),
        "harmonic": analyze_harmonic(y, sr),
        # "high_level": analyze_high_level(y, sr)
    }

    return numpy_to_list(features)

if __name__ == "__main__":
    # print(json.dumps({"log":"beginning python script"}))
    if len(sys.argv) < 2:
        print("Please provide the path to the audio file as an argument.")
        sys.exit(1)
    
    file_path = sys.argv[1]
    features = analyze_audio(file_path)
    json_output = json.dumps(features)
    print(json_output)
    
    # Print the length of the JSON string (for debugging)
    # print(json.dumps({"log":f"JSON length: {len(json_output)}"}))