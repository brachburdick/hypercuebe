import json
import sys

def generate_beatgrid(audio_file_path):
    try:
        import essentia.standard as es
        import numpy as np
        print('generating beatgrid from file:', audio_file_path, file=sys.stderr)
        # Load Audio

        
        audio = es.MonoLoader(filename=audio_file_path)() 

        # Compute beat positions and BPM.
        rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
        bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)

        # Create a dictionary to store the rhythm information
        rhythm_info = {
            'bpm': float(bpm),
            'beats': beats.tolist(),  # Convert numpy array to list for JSON serialization
            'beats_confidence': beats_confidence,
            'beats_intervals': beats_intervals.tolist()
        }

        # Convert the dictionary to a JSON string
        json_result = json.dumps(rhythm_info)
        print('JSON result:', json_result, file=sys.stderr)
        return json_result
    except Exception as e:
        print(f"Error in generate_beatgrid: {str(e)}", file=sys.stderr)
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = generate_beatgrid(sys.argv[1])
        print(json.dumps(result))  # This is what will be captured by the Node.js exec
    else:
        print(json.dumps({"error": "No audio file path provided"}))