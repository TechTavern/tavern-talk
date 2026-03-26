#!/bin/bash
# Fish Speech 1.5 - Docker Setup
# Downloads model checkpoints and starts the WebUI container

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECKPOINTS_DIR="$SCRIPT_DIR/checkpoints"

# Step 1: Download model checkpoints using a Docker container (no local install needed)
echo "=== Downloading Fish Speech 1.5 checkpoints ==="
if [ -d "$CHECKPOINTS_DIR/fish-speech-1.5" ] && [ "$(ls -A "$CHECKPOINTS_DIR/fish-speech-1.5" 2>/dev/null)" ]; then
    echo "Checkpoints already exist in $CHECKPOINTS_DIR/fish-speech-1.5, skipping download."
else
    echo "Downloading checkpoints via Docker (this may take a while, ~2-4GB)..."
    docker run --rm \
        -v "$CHECKPOINTS_DIR":/checkpoints \
        python:3.11-slim \
        python -c "
import subprocess, sys
subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'huggingface_hub'])
from huggingface_hub import snapshot_download
snapshot_download('fishaudio/fish-speech-1.5', local_dir='/checkpoints/fish-speech-1.5')
print('Download complete.')
"
    echo "Checkpoints downloaded to $CHECKPOINTS_DIR/fish-speech-1.5"
fi

# Step 2: Start Fish Speech WebUI
echo ""
echo "=== Starting Fish Speech WebUI ==="
echo "Note: COMPILE=1 is disabled to save VRAM (you have <24GB)"

# Stop existing container if running
docker rm -f fish-speech-webui 2>/dev/null || true

docker run -d --name fish-speech-webui --gpus all -p 7860:7860 \
    -v "$CHECKPOINTS_DIR":/app/checkpoints \
    fishaudio/fish-speech:v1.5.1

echo ""
echo "=== Fish Speech WebUI starting ==="
echo "WebUI will be available at: http://localhost:7860"
echo ""
echo "Check container logs with: docker logs -f fish-speech-webui"
echo "Stop with: docker rm -f fish-speech-webui"
