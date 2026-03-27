# Tavern Talk

A custom web interface for text-to-speech using [Fish Speech 1.5](https://github.com/fishaudio/fish-speech). Built with React + TypeScript, runs entirely in Docker with GPU acceleration.

## Requirements

- Docker with [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- NVIDIA GPU (~2GB VRAM)

## Quick Start

```bash
git clone <this-repo>
cd tavern-talk
docker compose --profile dev up
```

On first run this downloads the Fish Speech 1.5 model checkpoints (~1.4GB). Once you see `Vite ready` and `File API listening` in the logs, open **http://localhost:3000**.

## Features

- **Voice Synthesis** -- type text, adjust parameters, generate audio with one click
- **Full API control** -- all Fish Speech parameters exposed (temperature, top_p, repetition penalty, seed, chunk length, max tokens, streaming, normalize, memory cache)
- **Reproducible output** -- every generation gets a seed (auto-generated if not set), shown in the settings snapshot so you can recreate any result
- **Presets** -- save parameter settings as named presets, load them to instantly apply
- **Voice Profiles** -- upload reference audio to clone voices, with auto-transcription
- **Generation History** -- browse past generations, replay audio, re-apply settings
- **Settings** -- configure defaults, check API health
- **Hot-reload development** -- edit React components, see changes instantly

## Architecture

```
Browser :3000  -->  Vite dev server (React SPA)
       /api/*  -->  Fish Speech API (port 8080, internal)
     /files/*  -->  Express file API (port 3001, internal)
```

Three Docker services:

| Service | Purpose |
|---------|---------|
| `api` | Fish Speech 1.5 TTS engine (GPU) |
| `frontend-dev` | Vite + Express file API (development) |
| `frontend-prod` | nginx + Express file API (production) |

## Development

```bash
# Start with hot-reload
docker compose --profile dev up

# Rebuild after dependency changes
docker compose --profile dev up --build
```

Edit files in `frontend/src/` -- Vite hot-reloads automatically. The source directory is volume-mounted into the container.

## Production

```bash
docker compose --profile prod up --build
```

Builds the React app, serves static files via nginx on port 3000.

## Stopping

```bash
docker compose --profile dev down
```

## Project Structure

| Path | Description |
|------|-------------|
| `frontend/` | React + TypeScript app (Vite) |
| `frontend/src/pages/` | Synthesis, Voices, History, Settings pages |
| `frontend/src/components/` | Shared UI components |
| `frontend/src/api/` | Typed API clients (TTS, ASR, file operations) |
| `frontend/src/stores/` | Zustand state management |
| `frontend/server/` | Express file API sidecar |
| `docker-compose.yml` | Service orchestration with dev/prod profiles |
| `checkpoints/` | Model weights, auto-downloaded on first run (git-ignored) |
| `voices/` | Saved voice profiles (git-ignored) |
| `output/` | Generation history and settings (git-ignored) |
| `samples/` | Design docs and mockups |

## CLI Generation

The `generate.sh` script can generate audio directly from the command line. It requires the API to be running (start with `docker compose --profile dev up`):

```bash
./generate.sh "Welcome to the tavern, adventurer."
./generate.sh "Hello world" output/hello.wav
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router, Zustand, Radix UI Tooltip, Tabler Icons
- **File API**: Express, multer
- **TTS Engine**: Fish Speech 1.5 (fishaudio/fish-speech:v1.5.1)
- **Infrastructure**: Docker, nginx

## Notes

- Fish Speech 1.5 is licensed CC BY-NC-SA 4.0 (non-commercial use)
- All GPU devices are passed through to the API container
- Voice profiles and generation history persist in mounted volumes (`voices/`, `output/`)
