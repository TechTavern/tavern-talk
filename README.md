# Tavern Talk

Text-to-speech experiments using [Fish Speech 1.5](https://github.com/fishaudio/fish-speech). Runs entirely in Docker with GPU acceleration.

## Requirements

- Docker with [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed
- NVIDIA GPU (tested with ~2GB VRAM usage)

## Quick Start

```bash
git clone <this-repo>
cd tavern-talk
docker compose up
```

On first run this will:
1. Download the Fish Speech 1.5 model checkpoints (~1.4GB)
2. Start the Gradio WebUI

Once you see `Warming up done, launching the web UI...` in the logs, the app is ready.

## Using the Web Interface

Open **http://localhost:7860** in your browser. The Gradio interface lets you:

1. Enter text in the input field
2. Adjust generation parameters (temperature, top_p, repetition penalty)
3. Optionally upload a reference audio clip for voice cloning
4. Click **Generate** to synthesize speech
5. Listen to the result in-browser or download the audio file

## CLI Generation

You can also generate audio from the command line using `generate.sh`. This requires the Fish Speech API to be running on port 8080. To expose it, add port `8080:8080` to the `webui` service in `docker-compose.yml`, then:

```bash
# Generate with default text
./generate.sh

# Generate with custom text
./generate.sh "Welcome to the tavern, adventurer."

# Generate with custom text and output path
./generate.sh "Hello world" output/hello.wav
```

Output files are saved to `output/` by default.

## Alternative Setup

If you prefer running Docker commands directly instead of using Compose:

```bash
./setup.sh
```

This handles checkpoint downloading and container management in a single script. Check logs with `docker logs -f fish-speech-webui`.

## Stopping

```bash
docker compose down
```

## Re-running

After the first run, checkpoints are cached locally. Subsequent starts skip the download:

```bash
docker compose up webui
```

## Project Structure

| Path | Description |
|------|-------------|
| `docker-compose.yml` | Orchestrates checkpoint download and WebUI services |
| `download-checkpoints.py` | Downloads Fish Speech 1.5 model from Hugging Face |
| `generate.sh` | CLI script for generating audio via the API |
| `setup.sh` | Standalone Docker setup (alternative to Compose) |
| `checkpoints/` | Model weights, auto-downloaded on first run (git-ignored) |
| `output/` | Generated audio files (git-ignored) |

## Notes

- Uses Docker image `fishaudio/fish-speech:v1.5.1`
- All GPU devices are passed through to the container
- COMPILE mode is disabled by default to reduce VRAM usage
