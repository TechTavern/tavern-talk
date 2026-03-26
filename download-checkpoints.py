import subprocess
import sys
import os

dest = "/checkpoints/fish-speech-1.5"
marker = os.path.join(dest, "config.json")

if os.path.exists(marker):
    print("Checkpoints already downloaded, skipping.")
    sys.exit(0)

subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "huggingface_hub"])
from huggingface_hub import snapshot_download

snapshot_download("fishaudio/fish-speech-1.5", local_dir=dest)
print("Download complete.")
