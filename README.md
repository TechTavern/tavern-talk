# Fish Talk

Text-to-speech experiments using [Fish Speech 1.5](https://github.com/fishaudio/fish-speech). Runs entirely in Docker.

## Requirements

- Docker with [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed
- NVIDIA GPU (tested with ~2GB VRAM usage)

## Quick Start

```bash
git clone <this-repo>
cd fish-talk
docker compose up
```

On first run this will:
1. Download the Fish Speech 1.5 model checkpoints (~1.4GB)
2. Start the Gradio WebUI

Once you see `Warming up done, launching the web UI...` in the logs, open http://localhost:7860 in your browser, type some text, and hit generate.

## Stopping

```bash
docker compose down
```

## Re-running

After the first run, checkpoints are cached locally. Subsequent starts skip the download:

```bash
docker compose up webui
```

## Notes

- Model checkpoints are stored in `checkpoints/` (git-ignored)
- Uses Docker image `fishaudio/fish-speech:v1.5.1`
