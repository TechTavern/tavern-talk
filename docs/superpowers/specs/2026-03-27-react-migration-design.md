# Tavern Talk — React Migration & Feature Expansion

## Context

The current vanilla HTML/CSS/JS frontend works but lacks hot-reload development, exposes only 3 of 12+ API parameters through abstracted slider names, and has no voice upload or history features. This spec defines a React + TypeScript migration that adds a proper dev workflow, surfaces the full Fish Speech API, and builds out all four pages (Synthesis, Voices, History, Settings).

---

## Tech Stack

- **React 19** + **TypeScript** — component-driven UI with typed API contracts
- **Vite** — fast HMR, minimal config
- **React Router** — client-side routing for four pages
- **Zustand** — lightweight state for generation settings, presets, and cross-page state (e.g. "Use these settings" from History → Synthesis)
- **Express** — thin file API sidecar for volume read/write operations
- **Docker** — dev and prod profiles with volume mounts
- **CSS** — existing design system (tokens.css, layout.css, components.css) ported to the React project, using CSS Modules or plain CSS imports

---

## Architecture

### Docker Compose Services

```
docker compose --profile dev up     # development with hot-reload
docker compose --profile prod up    # production with nginx
```

| Service | Profile | Image | Port | Purpose |
|---|---|---|---|---|
| `api` | both | fishaudio/fish-speech:v1.5.1 | 8080 (internal) | Fish Speech TTS engine (GPU) |
| `frontend-dev` | dev | node:22-alpine | 3000 → host | Vite dev server + Express file API |
| `frontend-prod` | prod | nginx:1.25-alpine | 3000 → host | Built static files + Express file API |
| `download-checkpoints` | both | python:3.11-slim | — | One-time model download |

### Volume Mounts

| Host Path | Container Mount | Purpose |
|---|---|---|
| `./frontend/` | `/app` (dev) | Source code — live editing with hot-reload |
| `./voices/` | `/data/voices` | Saved voice profiles (JSON + audio files) |
| `./output/` | `/data/output` | Generation history (JSON + audio files) |
| `./checkpoints/` | `/app/checkpoints` (api) | Model weights |

### Request Routing

```
Browser :3000/*              → Vite dev server (dev) / nginx (prod) → React SPA
Browser :3000/api/*          → proxy → api:8080/* (Fish Speech TTS)
Browser :3000/files/*        → proxy → Express file API (localhost:3001)
```

The Express file API runs on port 3001 inside the frontend container. Vite (dev) and nginx (prod) both proxy `/files/*` to it.

---

## Pages & Routing

| Route | Page | Description |
|---|---|---|
| `/` | Synthesis | Main TTS interface — text input, all API parameters, voice selection, audio output |
| `/voices` | Voices | Upload, manage, and test voice profiles |
| `/history` | History | Browse past generations, replay audio, re-apply settings |
| `/settings` | Settings | Default parameters, output format, API health check |

Shared layout: sidebar nav + top nav bar persist across all pages. NavLinks highlight the active page.

---

## Synthesis Page

### Text Input
- Textarea with character count (0 / max)
- Clear button

### Voice Selector
- Dropdown or card showing the active voice profile name and description
- "Default (no reference)" always available
- Quick link to Voices page to create new profiles

### Primary Parameter Controls (always visible)

| Parameter | Control | Range | Default | API Field |
|---|---|---|---|---|
| Temperature | Slider | 0.1–1.0 | 0.7 | `temperature` |
| Top P | Slider | 0.1–1.0 | 0.7 | `top_p` |
| Repetition Penalty | Slider | 0.9–2.0 | 1.2 | `repetition_penalty` |
| Seed | Number input + lock toggle + dice button | int / null | null | `seed` |

Parameters are labeled with their real API names. Each has a tooltip with a plain-English description.

### Advanced Controls (collapsible, closed by default)

| Parameter | Control | Range | Default | API Field |
|---|---|---|---|---|
| Chunk Length | Slider | 100–300 | 200 | `chunk_length` |
| Max New Tokens | Slider | 256–2048 | 1024 | `max_new_tokens` |
| Output Format | Dropdown | WAV / MP3 | WAV | `format` |
| Normalize Text | Toggle | on/off | on | `normalize` |
| Streaming | Toggle | on/off | off | `streaming` |
| Memory Cache | Toggle | on/off | off | `use_memory_cache` |

### Generation Output
- Audio player with waveform visualization and playback controls
- **Settings snapshot** — displays all parameter values used for that generation
- **"Save as Preset"** button — saves current parameter values as a named preset
- **Auto-save to history** — every successful generation writes to `output/`

---

## Voices Page

### Voice Profile List
- Grid of cards: name, description, waveform thumbnail, play sample button
- Edit/delete actions per card
- "Default Voice" card always present (no reference audio)

### Create/Edit Voice Profile
- **Name** — text input
- **Description** — text input
- **Tags** — comma-separated labels
- **Reference audio** — file upload (WAV/MP3/FLAC, max 30 seconds)
- **Transcript** — textarea with **"Auto-transcribe"** button (calls `/v1/asr` endpoint)
- **Test** — quick synthesis with sample phrase using this profile

### Storage (`voices/` volume)
```
voices/
├── lyra-nocturne/
│   ├── profile.json      # { name, description, tags, transcript }
│   └── reference.wav     # uploaded audio file
├── gruff-bartender/
│   ├── profile.json
│   └── reference.wav
```

---

## History Page

### Storage (`output/` volume)
```
output/
├── 2026-03-27T13-04-22_lyra-nocturne.json
├── 2026-03-27T13-04-22_lyra-nocturne.wav
```

Each JSON file:
```json
{
  "text": "Welcome to the tavern...",
  "voice": "lyra-nocturne",
  "params": {
    "temperature": 0.7,
    "top_p": 0.7,
    "repetition_penalty": 1.2,
    "seed": 42,
    "chunk_length": 200,
    "max_new_tokens": 1024,
    "format": "wav",
    "normalize": true,
    "streaming": false,
    "use_memory_cache": "off"
  },
  "timestamp": "2026-03-27T13:04:22Z",
  "duration_seconds": 3.2,
  "file_size_bytes": 262188
}
```

### UI
- List view sorted by timestamp (newest first)
- Each row: timestamp, text preview, voice used, duration
- Expandable detail: full text, all parameter values
- **Play** — inline audio playback
- **"Use these settings"** — navigates to Synthesis with all parameters pre-filled
- **Delete** — removes JSON + audio file

---

## Settings Page

- Default parameter values form (persisted to `settings.json` in `output/` volume)
- Default output format preference
- API health indicator (pings `/v1/health`)

---

## File API (Express Sidecar)

A thin Express server (~100 lines TypeScript) running in the frontend container on port 3001. Handles CRUD for voice profiles, history, and settings on the mounted volumes.

### Endpoints

```
GET    /files/voices              → list voice profiles
GET    /files/voices/:id          → read profile.json
POST   /files/voices/:id          → save profile.json + reference audio (multipart)
DELETE /files/voices/:id          → delete voice folder

GET    /files/history             → list history records (JSON metadata only)
GET    /files/history/:id         → read history JSON
GET    /files/history/:id/audio   → stream audio file
POST   /files/history             → save new generation (JSON + audio)
DELETE /files/history/:id         → delete history entry

GET    /files/settings            → read settings.json
PUT    /files/settings            → write settings.json
```

Proxied through Vite (dev) and nginx (prod) at `/files/*`.

---

## Fish Speech API Contract (Reference)

### POST /v1/tts — Full Parameter List

| Parameter | Type | Range | Default | Description |
|---|---|---|---|---|
| `text` | string | required | — | Text to synthesize |
| `temperature` | float | 0.1–1.0 | 0.7 | Sampling temperature |
| `top_p` | float | 0.1–1.0 | 0.7 | Nucleus sampling |
| `repetition_penalty` | float | 0.9–2.0 | 1.2 | Token repetition penalty |
| `seed` | int/null | any | null | Random seed for reproducibility |
| `chunk_length` | int | 100–300 | 200 | Text chunk size for iterative generation |
| `max_new_tokens` | int | 1+ | 1024 | Max LLAMA tokens to generate |
| `format` | enum | wav/mp3/pcm | wav | Output audio format |
| `normalize` | bool | — | true | Normalize text (EN/ZH) |
| `streaming` | bool | — | false | Stream audio chunks (WAV only) |
| `use_memory_cache` | enum | on/off | off | Cache encoded reference audio |
| `references` | array | — | [] | Reference audio for voice cloning |
| `references[].audio` | bytes/base64 | — | — | Audio file content |
| `references[].text` | string | — | — | Transcript of reference audio |
| `reference_id` | string/null | — | null | Pre-registered reference ID |

### POST /v1/asr — Speech Recognition

Used by the "Auto-transcribe" feature on the Voices page.

Request: `{ audios: [bytes], sample_rate: int, language: "auto" }`
Response: `{ transcriptions: [{ text: string, duration: float }] }`

### GET /v1/health — Health Check

Response: `{ status: "ok" }`

---

## Design System

The existing "Editorial Technicality" design system from `samples/DESIGN.md` carries forward unchanged:

- Dark charcoal surfaces with tonal depth (no borders)
- Saffron (#ffb95d) accent, teal (#104d62) secondary, coral (#ffb4aa) primary
- Plus Jakarta Sans headlines, Work Sans body
- Glass blur on floating elements, ambient shadows only
- Existing `tokens.css` ported into the React project as a global stylesheet

---

## React Project Structure

```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html                    # Vite entry point
├── server/
│   └── file-api.ts               # Express file API sidecar
├── src/
│   ├── main.tsx                  # React entry + router setup
│   ├── App.tsx                   # Layout shell (sidebar + topnav + outlet)
│   ├── api/
│   │   ├── tts.ts                # Fish Speech TTS API client (typed)
│   │   ├── asr.ts                # ASR API client
│   │   ├── files.ts              # File API client (voices, history, settings)
│   │   └── types.ts              # TypeScript types matching API schema
│   ├── pages/
│   │   ├── Synthesis.tsx
│   │   ├── Voices.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── SliderControl.tsx
│   │   ├── ToggleControl.tsx
│   │   ├── VoiceCard.tsx
│   │   ├── HistoryRow.tsx
│   │   ├── SeedInput.tsx
│   │   ├── Toast.tsx
│   │   └── ParameterPanel.tsx
│   ├── stores/
│   │   └── synthesis.ts          # Zustand store for current params + presets
│   ├── hooks/
│   │   ├── useSynthesis.ts       # Generation logic hook
│   │   └── useAudioPlayer.ts     # Audio playback hook
│   └── css/
│       ├── tokens.css            # Design system variables (ported)
│       ├── layout.css            # Global layout styles
│       └── components.css        # Shared component styles
```

---

## Docker Configuration

### docker-compose.yml structure

```yaml
services:
  download-checkpoints:
    # unchanged

  api:
    image: fishaudio/fish-speech:v1.5.1
    command: >-
      python tools/api_server.py
      --listen 0.0.0.0:8080
      --load-asr-model
      --llama-checkpoint-path checkpoints/fish-speech-1.5
      --decoder-checkpoint-path checkpoints/fish-speech-1.5/firefly-gan-vq-fsq-8x1024-21hz-generator.pth
    expose: ["8080"]
    volumes:
      - ./checkpoints:/app/checkpoints
      - ./voices:/data/voices:ro          # API can read voice refs
    deploy: { GPU config }
    profiles: [dev, prod]

  frontend-dev:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports: ["3000:3000"]
    volumes:
      - ./frontend:/app                   # source code hot-reload
      - /app/node_modules                 # anonymous volume to avoid overwrite
      - ./voices:/data/voices             # voice profiles
      - ./output:/data/output             # generation history
    profiles: [dev]
    depends_on: [api]

  frontend-prod:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports: ["3000:80"]
    volumes:
      - ./voices:/data/voices
      - ./output:/data/output
    profiles: [prod]
    depends_on: [api]
```

### Dockerfile.dev
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 3000
CMD ["npm", "run", "dev"]
```
(`npm run dev` starts both Vite on :3000 and Express file API on :3001, with Vite proxying /files/* to :3001 and /api/* to api:8080)

### Dockerfile.prod
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/node_modules /opt/file-api/node_modules
COPY --from=build /app/server /opt/file-api/server
COPY --from=build /app/package.json /opt/file-api/
EXPOSE 80
CMD sh -c "node /opt/file-api/server/file-api.js & nginx -g 'daemon off;'"
```

---

## Verification

1. **Dev workflow**: `docker compose --profile dev up` → edit a React component → see change in browser without rebuild
2. **Synthesis**: Type text, adjust parameters, generate → audio plays, settings snapshot shown, history entry saved
3. **Seed reproducibility**: Lock seed, generate twice with same text → identical audio
4. **Voice upload**: Upload reference WAV on Voices page → auto-transcribe → test synthesis → save profile → use on Synthesis page
5. **History**: Generate several clips → History page lists them → "Use these settings" pre-fills Synthesis page
6. **Prod build**: `docker compose --profile prod up --build` → site loads on :3000, all features work
7. **Volume persistence**: Stop containers, restart → voices, history, settings all preserved
