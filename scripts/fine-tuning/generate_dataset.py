import json
import os

def create_director_samples():
    """
    Creates high-quality synthetic samples for the Visual Director agent.
    Focus: Mapping narrative intent to GenDoP (Camera Trajectory) math.
    """
    samples = [
        {
            "text": "### Instruction: Generate a cinematic camera trajectory for a tense confrontation scene. ### Scene: INT. WAREHOUSE - NIGHT. The Villain stands over the Hero. ### Trajectory: {\"positions\": [{\"x\": 0, \"y\": -5, \"z\": 1.7}, {\"x\": 0, \"y\": -2, \"z\": 1.7}], \"rotations\": [{\"x\": 0.1, \"y\": 0, \"z\": 0}], \"rationale\": \"A slow dolly-in to emphasize the power imbalance and rising tension.\"}"
        },
        {
            "text": "### Instruction: Generate a camera trajectory for a grand environmental reveal. ### Scene: EXT. FLOATING CITY - DAY. Sweeping view of the architecture. ### Trajectory: {\"positions\": [{\"x\": -50, \"y\": -50, \"z\": 20}, {\"x\": 50, \"y\": 50, \"z\": 30}], \"rotations\": [{\"x\": -0.2, \"y\": 0, \"z\": 0.78}], \"rationale\": \"A sweeping crane shot to capture the scale and majesty of the city.\"}"
        },
        {
            "text": "### Instruction: Generate an unsettling handheld shot for a horror sequence. ### Scene: INT. ABANDONED ASYLUM - NIGHT. A shadow moves at the end of the hall. ### Trajectory: {\"positions\": [{\"x\": 0, \"y\": 0, \"z\": 1.6}, {\"x\": 0.1, \"y\": 0.5, \"z\": 1.62}], \"rotations\": [{\"x\": 0, \"y\": 0.05, \"z\": 0.02}], \"rationale\": \"Unsteady handheld movement to create a sense of voyeurism and dread.\"}"
        }
    ]
    
    os.makedirs("scripts/fine-tuning/data", exist_ok=True)
    with open("scripts/fine-tuning/data/director_samples.jsonl", "w") as f:
        for sample in samples:
            f.write(json.dumps(sample) + "\n")

def create_scriptwriter_samples():
    """
    Creates samples for the Scriptwriter agent.
    Focus: Book text -> Fountain Screenplay conversion.
    """
    samples = [
        {
            "text": "### Instruction: Convert this book excerpt into a Fountain-format screenplay. ### Book: The rain lashed against the windows of the old mansion. Arthur paced the study, his footsteps echoing on the oak floor. 'It's gone,' he whispered to the empty room. ### Screenplay: INT. OLD MANSION - STUDY - NIGHT\n\nRain LASHES against the windows.\n\nARTHUR paces the study. His footsteps ECHO on the oak floor.\n\nARTHUR\n(whispering)\nIt's gone."
        }
    ]
    
    with open("scripts/fine-tuning/data/scriptwriter_samples.jsonl", "w") as f:
        for sample in samples:
            f.write(json.dumps(sample) + "\n")

if __name__ == "__main__":
    create_director_samples()
    create_scriptwriter_samples()
    print("Synthetic datasets generated in scripts/fine-tuning/data/")
