
import json

def generate_beatgrid(audio_file_path):
    import essentia.standard as es
    import numpy as np
    print('generating beatgrid from file:', audio_file_path)
    # Load Audio
    audio = es.MonoLoader(filename=audio_file_path)() 

    # Compute beat positions and BPM.
    rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
    bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)

    # Create a dictionary to store the rhythm information
    rhythm_info = {
        'bpm': float(bpm),
        'beats': beats.tolist(),  # Convert numpy array to list for JSON serialization
        'beats_confidence': beats_confidence.tolist(),
        'beats_intervals': beats_intervals.tolist()
    }

    # Convert the dictionary to a JSON string
    return json.dumps(rhythm_info)
