# React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the vanilla HTML/CSS/JS frontend to React + TypeScript with Vite, add full Fish Speech API parameter exposure, voice profile management, generation history, and settings persistence — all with hot-reload Docker development.

**Architecture:** Vite + React 19 + TypeScript frontend with an Express file API sidecar, both running in a Docker container. Dev profile volume-mounts source for hot-reload; prod profile builds static files served by nginx. Fish Speech API proxied at `/api/*`, file operations at `/files/*`.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Zustand, Express, multer, Docker, nginx

**Spec:** `docs/superpowers/specs/2026-03-27-react-migration-design.md`

**Design System:** `samples/DESIGN.md` — "Editorial Technicality" dark tavern theme

---

## File Map

### New files to create

```
frontend/
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript config
├── tsconfig.node.json                # TS config for Vite/server
├── vite.config.ts                    # Vite config with proxy rules
├── index.html                        # Vite entry point (replaces src/index.html)
├── nginx.conf                        # Updated: add /files/* proxy
├── Dockerfile.dev                    # Node dev container
├── Dockerfile.prod                   # Multi-stage build → nginx + Express
├── server/
│   ├── file-api.ts                   # Express file API sidecar
│   └── tsconfig.json                 # Server TS config (CommonJS)
├── src/
│   ├── main.tsx                      # React entry + BrowserRouter
│   ├── App.tsx                       # Layout shell (sidebar + topnav + <Outlet />)
│   ├── api/
│   │   ├── types.ts                  # All TypeScript types (API request/response, voice profile, history record)
│   │   ├── tts.ts                    # synthesize() and healthCheck() functions
│   │   ├── asr.ts                    # transcribeAudio() function
│   │   └── files.ts                  # Voice, history, and settings CRUD functions
│   ├── stores/
│   │   └── synthesis.ts              # Zustand store: params, voice, presets, generation result
│   ├── hooks/
│   │   ├── useSynthesis.ts           # Orchestrates TTS call + history save
│   │   └── useAudioPlayer.ts         # Audio element control (play/pause/seek/time)
│   ├── components/
│   │   ├── Sidebar.tsx               # Nav sidebar with brand + links
│   │   ├── TopNav.tsx                # Horizontal tab nav
│   │   ├── AudioPlayer.tsx           # Waveform + controls + download
│   │   ├── SliderControl.tsx         # Labeled range slider with value display + tooltip
│   │   ├── ToggleControl.tsx         # Labeled toggle switch
│   │   ├── SeedInput.tsx             # Number input + lock toggle + dice randomizer
│   │   ├── VoiceCard.tsx             # Voice profile card (grid item)
│   │   ├── VoiceSelector.tsx         # Dropdown/card for picking active voice on Synthesis page
│   │   ├── HistoryRow.tsx            # Expandable history list item
│   │   ├── ParameterPanel.tsx        # Collapsible advanced params section
│   │   └── Toast.tsx                 # Toast notification system
│   ├── pages/
│   │   ├── Synthesis.tsx             # Main TTS page
│   │   ├── Voices.tsx                # Voice profile management
│   │   ├── History.tsx               # Generation history browser
│   │   └── Settings.tsx              # Default params + health check
│   └── css/
│       ├── tokens.css                # Ported from current frontend (design variables + reset)
│       ├── layout.css                # Ported + adapted for React component structure
│       └── components.css            # Ported + adapted component styles
```

### Files to modify

```
docker-compose.yml                    # Replace frontend service with frontend-dev + frontend-prod profiles
.gitignore                            # Add node_modules, dist
```

### Files to delete (after migration complete)

```
frontend/Dockerfile                   # Replaced by Dockerfile.dev + Dockerfile.prod
frontend/src/index.html               # Replaced by frontend/index.html (Vite entry)
frontend/src/js/app.js                # Replaced by React components
```

---

## Task 1: Scaffold React + Vite + TypeScript project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Modify: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tavern-talk",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"vite --host 0.0.0.0\" \"tsx watch server/file-api.ts\"",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "server": "tsx server/file-api.ts"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "concurrently": "^9.1.0",
    "express": "^4.21.0",
    "@types/express": "^4.17.21",
    "multer": "^1.4.5-lts.1",
    "@types/multer": "^1.4.12",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

Write to `frontend/package.json`.

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

Write to `frontend/tsconfig.json`.

- [ ] **Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Write to `frontend/tsconfig.node.json`.

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://api:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/files': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

Write to `frontend/vite.config.ts`.

- [ ] **Step 5: Create Vite entry HTML**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tavern Talk</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Write to `frontend/index.html`.

- [ ] **Step 6: Update .gitignore**

Add these lines to the project root `.gitignore`:

```
node_modules/
dist/
frontend/node_modules/
frontend/dist/
```

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html .gitignore
git commit -m "feat: scaffold React + Vite + TypeScript project"
```

---

## Task 2: Docker dev infrastructure

**Files:**
- Create: `frontend/Dockerfile.dev`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile.dev**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
EXPOSE 3000 3001
CMD ["npm", "run", "dev"]
```

Write to `frontend/Dockerfile.dev`.

- [ ] **Step 2: Install dependencies locally to generate lock file**

Run from `frontend/`:
```bash
cd frontend && npm install && cd ..
```

This creates `package-lock.json` which the Dockerfile needs.

- [ ] **Step 3: Update docker-compose.yml**

Replace the entire file with:

```yaml
services:
  # One-time: downloads model checkpoints (~1.4GB)
  download-checkpoints:
    image: python:3.11-slim
    volumes:
      - ./checkpoints:/checkpoints
      - ./download-checkpoints.py:/download-checkpoints.py:ro
    command: python /download-checkpoints.py
    profiles: [dev, prod]

  # Fish Speech 1.5 TTS API Server
  api:
    image: fishaudio/fish-speech:v1.5.1
    command: >-
      python tools/api_server.py
      --listen 0.0.0.0:8080
      --load-asr-model
      --llama-checkpoint-path checkpoints/fish-speech-1.5
      --decoder-checkpoint-path checkpoints/fish-speech-1.5/firefly-gan-vq-fsq-8x1024-21hz-generator.pth
    expose:
      - "8080"
    volumes:
      - ./checkpoints:/app/checkpoints
      - ./voices:/data/voices:ro
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    depends_on:
      download-checkpoints:
        condition: service_completed_successfully
    profiles: [dev, prod]

  # Development: Vite hot-reload + Express file API
  frontend-dev:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - ./voices:/data/voices
      - ./output:/data/output
    environment:
      - DATA_DIR=/data
    profiles: [dev]
    depends_on:
      - api
```

- [ ] **Step 4: Create data directories**

```bash
mkdir -p voices output
```

- [ ] **Step 5: Verify dev container builds and starts**

```bash
docker compose --profile dev up --build frontend-dev
```

Expected: Container starts, Vite outputs "ready in Xms" and "Local: http://localhost:3000/". The page will show a blank screen (no React code yet). Press Ctrl+C to stop.

- [ ] **Step 6: Commit**

```bash
git add frontend/Dockerfile.dev frontend/package-lock.json docker-compose.yml
git commit -m "feat: add Docker dev profile with Vite hot-reload"
```

---

## Task 3: TypeScript types and API clients

**Files:**
- Create: `frontend/src/api/types.ts`
- Create: `frontend/src/api/tts.ts`
- Create: `frontend/src/api/asr.ts`
- Create: `frontend/src/api/files.ts`

- [ ] **Step 1: Create types.ts — all shared TypeScript types**

```typescript
// Fish Speech TTS API types

export interface TTSRequest {
  text: string;
  chunk_length?: number;        // 100-300, default 200
  format?: 'wav' | 'mp3' | 'pcm'; // default 'wav'
  references?: AudioReference[];
  reference_id?: string | null;
  seed?: number | null;
  use_memory_cache?: 'on' | 'off'; // default 'off'
  normalize?: boolean;           // default true
  streaming?: boolean;           // default false
  max_new_tokens?: number;       // default 1024
  top_p?: number;                // 0.1-1.0, default 0.7
  repetition_penalty?: number;   // 0.9-2.0, default 1.2
  temperature?: number;          // 0.1-1.0, default 0.7
}

export interface AudioReference {
  audio: string;  // base64-encoded audio
  text: string;   // transcript of the audio
}

export interface ASRRequest {
  audios: string[];     // base64-encoded PCM audio
  sample_rate: number;
  language: 'zh' | 'en' | 'ja' | 'auto';
}

export interface ASRResponse {
  transcriptions: Array<{
    text: string;
    duration: number;
    huge_gap: boolean;
  }>;
}

export interface HealthResponse {
  status: string;
}

// App-level types

export interface SynthesisParams {
  temperature: number;
  top_p: number;
  repetition_penalty: number;
  seed: number | null;
  chunk_length: number;
  max_new_tokens: number;
  format: 'wav' | 'mp3';
  normalize: boolean;
  streaming: boolean;
  use_memory_cache: 'on' | 'off';
}

export const DEFAULT_PARAMS: SynthesisParams = {
  temperature: 0.7,
  top_p: 0.7,
  repetition_penalty: 1.2,
  seed: null,
  chunk_length: 200,
  max_new_tokens: 1024,
  format: 'wav',
  normalize: true,
  streaming: false,
  use_memory_cache: 'off',
};

export interface VoiceProfile {
  id: string;           // directory name, e.g. "lyra-nocturne"
  name: string;
  description: string;
  tags: string[];
  transcript: string;
  hasAudio: boolean;    // whether reference.wav exists
}

export interface HistoryRecord {
  id: string;           // filename stem, e.g. "2026-03-27T13-04-22_lyra-nocturne"
  text: string;
  voice: string;        // voice profile id or "default"
  params: SynthesisParams;
  timestamp: string;    // ISO 8601
  duration_seconds: number;
  file_size_bytes: number;
}

export interface AppSettings {
  defaultParams: SynthesisParams;
  defaultFormat: 'wav' | 'mp3';
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultParams: { ...DEFAULT_PARAMS },
  defaultFormat: 'wav',
};
```

Write to `frontend/src/api/types.ts`.

- [ ] **Step 2: Create tts.ts — TTS and health API client**

```typescript
import type { TTSRequest, HealthResponse } from './types';

export async function synthesize(request: TTSRequest): Promise<Blob> {
  const response = await fetch('/api/v1/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `TTS API error: ${response.status}`);
  }

  const blob = await response.blob();
  if (blob.size < 1000) {
    throw new Error('Generated audio is too small — the model may have failed.');
  }

  return blob;
}

export async function healthCheck(): Promise<HealthResponse> {
  const response = await fetch('/api/v1/health');
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}
```

Write to `frontend/src/api/tts.ts`.

- [ ] **Step 3: Create asr.ts — speech recognition client**

```typescript
import type { ASRResponse } from './types';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Convert blob to base64
  const buffer = await audioBlob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const response = await fetch('/api/v1/asr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audios: [base64],
      sample_rate: 44100,
      language: 'auto',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `ASR error: ${response.status}`);
  }

  const data: ASRResponse = await response.json();
  if (data.transcriptions.length === 0) {
    throw new Error('No transcription returned');
  }

  return data.transcriptions.map((t) => t.text).join(' ');
}
```

Write to `frontend/src/api/asr.ts`.

- [ ] **Step 4: Create files.ts — file API client for voices, history, settings**

```typescript
import type { VoiceProfile, HistoryRecord, AppSettings, SynthesisParams } from './types';

// ── Voices ──

export async function listVoices(): Promise<VoiceProfile[]> {
  const res = await fetch('/files/voices');
  if (!res.ok) throw new Error(`Failed to list voices: ${res.status}`);
  return res.json();
}

export async function getVoice(id: string): Promise<VoiceProfile> {
  const res = await fetch(`/files/voices/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to get voice: ${res.status}`);
  return res.json();
}

export async function saveVoice(
  id: string,
  profile: Omit<VoiceProfile, 'id' | 'hasAudio'>,
  audioFile?: File
): Promise<void> {
  const formData = new FormData();
  formData.append('profile', JSON.stringify(profile));
  if (audioFile) {
    formData.append('audio', audioFile);
  }
  const res = await fetch(`/files/voices/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to save voice: ${res.status}`);
}

export async function deleteVoice(id: string): Promise<void> {
  const res = await fetch(`/files/voices/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete voice: ${res.status}`);
}

export function getVoiceAudioUrl(id: string): string {
  return `/files/voices/${encodeURIComponent(id)}/audio`;
}

// ── History ──

export async function listHistory(): Promise<HistoryRecord[]> {
  const res = await fetch('/files/history');
  if (!res.ok) throw new Error(`Failed to list history: ${res.status}`);
  return res.json();
}

export async function saveHistory(
  record: Omit<HistoryRecord, 'id'>,
  audioBlob: Blob
): Promise<void> {
  const formData = new FormData();
  formData.append('record', JSON.stringify(record));
  formData.append('audio', audioBlob, `audio.${record.params.format}`);
  const res = await fetch('/files/history', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to save history: ${res.status}`);
}

export async function deleteHistory(id: string): Promise<void> {
  const res = await fetch(`/files/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete history: ${res.status}`);
}

export function getHistoryAudioUrl(id: string): string {
  return `/files/history/${encodeURIComponent(id)}/audio`;
}

// ── Settings ──

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch('/files/settings');
  if (!res.ok) throw new Error(`Failed to get settings: ${res.status}`);
  return res.json();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const res = await fetch('/files/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`);
}

// ── Voice reference audio loader (for TTS requests) ──

export async function loadVoiceReferenceBase64(id: string): Promise<string> {
  const res = await fetch(getVoiceAudioUrl(id));
  if (!res.ok) throw new Error(`Failed to load voice audio: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
}
```

Write to `frontend/src/api/files.ts`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/
git commit -m "feat: add TypeScript types and API clients for TTS, ASR, and file operations"
```

---

## Task 4: Express file API sidecar

**Files:**
- Create: `frontend/server/file-api.ts`
- Create: `frontend/server/tsconfig.json`

- [ ] **Step 1: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["./**/*.ts"]
}
```

Write to `frontend/server/tsconfig.json`.

- [ ] **Step 2: Create file-api.ts**

```typescript
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || '/data';
const VOICES_DIR = path.join(DATA_DIR, 'voices');
const OUTPUT_DIR = path.join(DATA_DIR, 'output');

// Ensure directories exist
fs.mkdirSync(VOICES_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const upload = multer({ storage: multer.memoryStorage() });

// ── Voices ──

app.get('/files/voices', (_req, res) => {
  const entries = fs.readdirSync(VOICES_DIR, { withFileTypes: true });
  const voices = entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const profilePath = path.join(VOICES_DIR, e.name, 'profile.json');
      if (!fs.existsSync(profilePath)) return null;
      const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
      const hasAudio = fs.existsSync(path.join(VOICES_DIR, e.name, 'reference.wav'))
        || fs.existsSync(path.join(VOICES_DIR, e.name, 'reference.mp3'))
        || fs.existsSync(path.join(VOICES_DIR, e.name, 'reference.flac'));
      return { id: e.name, ...profile, hasAudio };
    })
    .filter(Boolean);
  res.json(voices);
});

app.get('/files/voices/:id', (req, res) => {
  const profilePath = path.join(VOICES_DIR, req.params.id, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    res.status(404).json({ error: 'Voice not found' });
    return;
  }
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  const dir = path.join(VOICES_DIR, req.params.id);
  const hasAudio = fs.readdirSync(dir).some((f) => f.startsWith('reference.'));
  res.json({ id: req.params.id, ...profile, hasAudio });
});

app.get('/files/voices/:id/audio', (req, res) => {
  const dir = path.join(VOICES_DIR, req.params.id);
  const audioFile = ['reference.wav', 'reference.mp3', 'reference.flac']
    .map((f) => path.join(dir, f))
    .find((f) => fs.existsSync(f));
  if (!audioFile) {
    res.status(404).json({ error: 'Audio not found' });
    return;
  }
  res.sendFile(audioFile);
});

app.post('/files/voices/:id', upload.single('audio'), (req, res) => {
  const dir = path.join(VOICES_DIR, req.params.id);
  fs.mkdirSync(dir, { recursive: true });

  if (req.body.profile) {
    const profile = JSON.parse(req.body.profile);
    fs.writeFileSync(path.join(dir, 'profile.json'), JSON.stringify(profile, null, 2));
  }

  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.wav';
    fs.writeFileSync(path.join(dir, `reference${ext}`), req.file.buffer);
  }

  res.json({ ok: true });
});

app.delete('/files/voices/:id', (req, res) => {
  const dir = path.join(VOICES_DIR, req.params.id);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
  res.json({ ok: true });
});

// ── History ──

app.get('/files/history', (_req, res) => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    res.json([]);
    return;
  }
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.json'));
  const records = files
    .map((f) => {
      const content = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8'));
      return { id: f.replace('.json', ''), ...content };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(records);
});

app.get('/files/history/:id', (req, res) => {
  const jsonPath = path.join(OUTPUT_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(jsonPath)) {
    res.status(404).json({ error: 'History record not found' });
    return;
  }
  const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  res.json({ id: req.params.id, ...content });
});

app.get('/files/history/:id/audio', (req, res) => {
  const dir = OUTPUT_DIR;
  const audioFile = ['wav', 'mp3'].map((ext) => path.join(dir, `${req.params.id}.${ext}`)).find((f) => fs.existsSync(f));
  if (!audioFile) {
    res.status(404).json({ error: 'Audio not found' });
    return;
  }
  res.sendFile(audioFile);
});

app.post('/files/history', upload.single('audio'), (req, res) => {
  if (!req.body.record) {
    res.status(400).json({ error: 'Missing record' });
    return;
  }
  const record = JSON.parse(req.body.record);
  const ts = new Date(record.timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const voice = record.voice || 'default';
  const id = `${ts}_${voice}`;
  const format = record.params?.format || 'wav';

  fs.writeFileSync(path.join(OUTPUT_DIR, `${id}.json`), JSON.stringify(record, null, 2));

  if (req.file) {
    fs.writeFileSync(path.join(OUTPUT_DIR, `${id}.${format}`), req.file.buffer);
  }

  res.json({ ok: true, id });
});

app.delete('/files/history/:id', (req, res) => {
  const base = path.join(OUTPUT_DIR, req.params.id);
  for (const ext of ['.json', '.wav', '.mp3']) {
    const f = base + ext;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  res.json({ ok: true });
});

// ── Settings ──

const SETTINGS_PATH = path.join(OUTPUT_DIR, 'settings.json');

app.get('/files/settings', (_req, res) => {
  if (!fs.existsSync(SETTINGS_PATH)) {
    res.json(null);
    return;
  }
  res.json(JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')));
});

app.put('/files/settings', (req, res) => {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// ── Start ──

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`File API listening on port ${PORT}`);
  console.log(`  Voices dir: ${VOICES_DIR}`);
  console.log(`  Output dir: ${OUTPUT_DIR}`);
});
```

Write to `frontend/server/file-api.ts`.

- [ ] **Step 3: Verify the file API starts**

```bash
docker compose --profile dev up --build frontend-dev
```

Expected: Both Vite and the file API start. You should see "File API listening on port 3001" in the logs alongside Vite's "ready" message.

- [ ] **Step 4: Test file API endpoints**

```bash
curl -s http://localhost:3000/files/voices | python3 -m json.tool
curl -s http://localhost:3000/files/history | python3 -m json.tool
curl -s http://localhost:3000/files/settings | python3 -m json.tool
```

Expected: `[]`, `[]`, `null` respectively (empty data directories).

- [ ] **Step 5: Commit**

```bash
git add frontend/server/
git commit -m "feat: add Express file API sidecar for voices, history, and settings"
```

---

## Task 5: Zustand store

**Files:**
- Create: `frontend/src/stores/synthesis.ts`

- [ ] **Step 1: Create the synthesis store**

```typescript
import { create } from 'zustand';
import type { SynthesisParams, VoiceProfile } from '@/api/types';
import { DEFAULT_PARAMS } from '@/api/types';

interface SynthesisState {
  // Current parameters
  params: SynthesisParams;
  setParam: <K extends keyof SynthesisParams>(key: K, value: SynthesisParams[K]) => void;
  setParams: (params: Partial<SynthesisParams>) => void;
  resetParams: () => void;

  // Text input
  text: string;
  setText: (text: string) => void;

  // Seed lock
  seedLocked: boolean;
  setSeedLocked: (locked: boolean) => void;

  // Active voice
  activeVoice: VoiceProfile | null;
  setActiveVoice: (voice: VoiceProfile | null) => void;

  // Generation state
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;

  // Last generation result
  lastAudioUrl: string | null;
  lastParams: SynthesisParams | null;
  setLastResult: (audioUrl: string | null, params: SynthesisParams | null) => void;

  // Presets
  presets: Record<string, SynthesisParams>;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
}

export const useSynthesisStore = create<SynthesisState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  setParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),
  setParams: (partial) =>
    set((state) => ({ params: { ...state.params, ...partial } })),
  resetParams: () => set({ params: { ...DEFAULT_PARAMS } }),

  text: '',
  setText: (text) => set({ text }),

  seedLocked: false,
  setSeedLocked: (seedLocked) => set({ seedLocked }),

  activeVoice: null,
  setActiveVoice: (activeVoice) => set({ activeVoice }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  lastAudioUrl: null,
  lastParams: null,
  setLastResult: (lastAudioUrl, lastParams) => set({ lastAudioUrl, lastParams }),

  presets: {},
  savePreset: (name) =>
    set((state) => ({
      presets: { ...state.presets, [name]: { ...state.params } },
    })),
  loadPreset: (name) => {
    const preset = get().presets[name];
    if (preset) set({ params: { ...preset } });
  },
  deletePreset: (name) =>
    set((state) => {
      const { [name]: _, ...rest } = state.presets;
      return { presets: rest };
    }),
}));
```

Write to `frontend/src/stores/synthesis.ts`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/stores/
git commit -m "feat: add Zustand synthesis store for params, voice, and presets"
```

---

## Task 6: Port CSS design system

**Files:**
- Create: `frontend/src/css/tokens.css` (port from existing)
- Create: `frontend/src/css/layout.css` (port + adapt)
- Create: `frontend/src/css/components.css` (port + adapt)

- [ ] **Step 1: Copy and adapt tokens.css**

Copy `frontend/src/css/tokens.css` from the current vanilla frontend. This file is already well-structured and needs no React-specific changes. Keep the Google Fonts import, CSS custom properties, reset, selection styles, and scrollbar styles as-is.

- [ ] **Step 2: Adapt layout.css**

Copy `frontend/src/css/layout.css` from the current vanilla frontend. Changes needed:
- The body grid and sidebar styles remain the same
- The `.main` styles remain the same
- The `.topnav` and `.hero` styles remain the same
- The `.content-grid` becomes page-specific — keep it but understand individual pages will use their own grid layouts
- The `.toast-container` stays global
- The responsive breakpoint stays

- [ ] **Step 3: Adapt components.css**

Copy `frontend/src/css/components.css` from the current vanilla frontend. All component styles carry forward. New styles to add will be written alongside their React components in later tasks.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/css/
git commit -m "feat: port design system CSS to React project"
```

---

## Task 7: React entry point, router, and layout shell

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/TopNav.tsx`
- Create: `frontend/src/components/Toast.tsx`
- Create placeholder pages

- [ ] **Step 1: Create main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './css/tokens.css';
import './css/layout.css';
import './css/components.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

Write to `frontend/src/main.tsx`.

- [ ] **Step 2: Create App.tsx with routes**

```tsx
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ToastContainer } from './components/Toast';
import { Synthesis } from './pages/Synthesis';
import { Voices } from './pages/Voices';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <>
      <Sidebar />
      <main className="main">
        <TopNav />
        <Routes>
          <Route path="/" element={<Synthesis />} />
          <Route path="/voices" element={<Voices />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <ToastContainer />
    </>
  );
}
```

Write to `frontend/src/App.tsx`.

- [ ] **Step 3: Create Sidebar.tsx**

```tsx
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' },
  { to: '/voices', label: 'Voices', icon: 'M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z' },
  { to: '/history', label: 'History', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' },
  { to: '/settings', label: 'Settings', icon: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z' },
];

const footerItems = [
  { to: '#', label: 'Support', icon: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z' },
  { to: '#', label: 'Logout', icon: 'M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d={d} clipRule="evenodd" />
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg className="sidebar-brand-icon" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="var(--tertiary)" strokeWidth="1.5" fill="none" />
          <path d="M16 8 L20 14 L16 12 L12 14 Z" fill="var(--tertiary)" opacity="0.8" />
          <path d="M10 16 Q16 24 22 16" stroke="var(--tertiary)" strokeWidth="1.5" fill="none" />
        </svg>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Tavern Talk</span>
          <span className="sidebar-brand-role">Brewmaster</span>
          <span className="sidebar-brand-sub">Synthesis Expert</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <NavIcon d={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {footerItems.map((item) => (
          <a key={item.label} href={item.to} className="sidebar-link">
            <NavIcon d={item.icon} />
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
```

Write to `frontend/src/components/Sidebar.tsx`.

- [ ] **Step 4: Create TopNav.tsx**

```tsx
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/voices', label: 'Voices' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export function TopNav() {
  return (
    <nav className="topnav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => `topnav-tab${isActive ? ' active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

Write to `frontend/src/components/TopNav.tsx`.

- [ ] **Step 5: Create Toast.tsx**

```tsx
import { useState, useCallback, createContext, useContext } from 'react';

type ToastType = 'error' | 'success';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Standalone container for use outside provider (backward compat)
export function ToastContainer() {
  return null; // Toasts rendered by ToastProvider
}
```

Write to `frontend/src/components/Toast.tsx`.

- [ ] **Step 6: Create placeholder pages**

Create four placeholder page components:

`frontend/src/pages/Synthesis.tsx`:
```tsx
export function Synthesis() {
  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Voice Synthesis</h1>
        <p className="hero-sub">Transmute your script into atmospheric audio using our refined alchemical models.</p>
      </header>
      <p style={{ color: 'var(--on-surface-muted)' }}>Synthesis page — coming soon.</p>
    </>
  );
}
```

`frontend/src/pages/Voices.tsx`:
```tsx
export function Voices() {
  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Voice Profiles</h1>
        <p className="hero-sub">Upload reference audio to clone voices for your alchemical experiments.</p>
      </header>
      <p style={{ color: 'var(--on-surface-muted)' }}>Voices page — coming soon.</p>
    </>
  );
}
```

`frontend/src/pages/History.tsx`:
```tsx
export function History() {
  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Generation History</h1>
        <p className="hero-sub">Browse and replay your past alchemical transmutations.</p>
      </header>
      <p style={{ color: 'var(--on-surface-muted)' }}>History page — coming soon.</p>
    </>
  );
}
```

`frontend/src/pages/Settings.tsx`:
```tsx
export function Settings() {
  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Settings</h1>
        <p className="hero-sub">Configure your default alchemical parameters.</p>
      </header>
      <p style={{ color: 'var(--on-surface-muted)' }}>Settings page — coming soon.</p>
    </>
  );
}
```

- [ ] **Step 7: Update main.tsx to include ToastProvider**

Wrap `BrowserRouter` with `ToastProvider`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from './components/Toast';
import './css/tokens.css';
import './css/layout.css';
import './css/components.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 8: Verify in browser**

```bash
docker compose --profile dev up
```

Open http://localhost:3000. Expected: dark-themed page with sidebar, top nav, "Voice Synthesis" heading. Click "Voices", "History", "Settings" in sidebar — each should route to its placeholder page with active link highlighted.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/
git commit -m "feat: add React router, layout shell, sidebar, topnav, and placeholder pages"
```

---

## Task 8: Shared UI components

**Files:**
- Create: `frontend/src/components/SliderControl.tsx`
- Create: `frontend/src/components/ToggleControl.tsx`
- Create: `frontend/src/components/SeedInput.tsx`
- Create: `frontend/src/components/ParameterPanel.tsx`
- Create: `frontend/src/components/AudioPlayer.tsx`
- Create: `frontend/src/hooks/useAudioPlayer.ts`

- [ ] **Step 1: Create SliderControl.tsx**

```tsx
interface SliderControlProps {
  label: string;
  tooltip?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue?: string;
  onChange: (value: number) => void;
}

export function SliderControl({ label, tooltip, value, min, max, step, displayValue, onChange }: SliderControlProps) {
  return (
    <div className="slider-group">
      <div className="slider-row">
        <label className="slider-label" title={tooltip}>
          {label}
          {tooltip && <span className="slider-tooltip-icon" title={tooltip}> &#9432;</span>}
        </label>
        <output className="slider-value">{displayValue ?? value}</output>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

Write to `frontend/src/components/SliderControl.tsx`.

- [ ] **Step 2: Create ToggleControl.tsx**

```tsx
interface ToggleControlProps {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleControl({ label, tooltip, checked, onChange }: ToggleControlProps) {
  return (
    <label className="modifier" title={tooltip}>
      <input
        type="checkbox"
        className="modifier-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="modifier-body">
        <span className="modifier-name">{label}</span>
      </span>
    </label>
  );
}
```

Write to `frontend/src/components/ToggleControl.tsx`.

- [ ] **Step 3: Create SeedInput.tsx**

```tsx
interface SeedInputProps {
  seed: number | null;
  locked: boolean;
  onSeedChange: (seed: number | null) => void;
  onLockedChange: (locked: boolean) => void;
}

export function SeedInput({ seed, locked, onSeedChange, onLockedChange }: SeedInputProps) {
  const randomize = () => {
    onSeedChange(Math.floor(Math.random() * 2147483647));
  };

  return (
    <div className="slider-group">
      <div className="slider-row">
        <label className="slider-label" title="Set a seed for reproducible output. Lock to reuse across generations.">
          Seed &#9432;
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input
            type="number"
            value={seed ?? ''}
            placeholder="Random"
            onChange={(e) => onSeedChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            style={{
              width: '90px',
              background: 'var(--surface-highest)',
              border: '2px solid transparent',
              borderRadius: 'var(--radius-md)',
              color: 'var(--on-surface)',
              padding: 'var(--space-1) var(--space-2)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-body)',
            }}
          />
          <button
            type="button"
            onClick={randomize}
            title="Randomize seed"
            className="btn btn--ghost"
            style={{ padding: 'var(--space-1)' }}
          >
            &#127922;
          </button>
          <button
            type="button"
            onClick={() => onLockedChange(!locked)}
            title={locked ? 'Unlock seed (random each time)' : 'Lock seed (reuse across generations)'}
            className="btn btn--ghost"
            style={{ padding: 'var(--space-1)', color: locked ? 'var(--tertiary)' : undefined }}
          >
            {locked ? '\u{1F512}' : '\u{1F513}'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Write to `frontend/src/components/SeedInput.tsx`.

- [ ] **Step 4: Create ParameterPanel.tsx**

```tsx
import { useState } from 'react';
import { SliderControl } from './SliderControl';
import { ToggleControl } from './ToggleControl';
import { SeedInput } from './SeedInput';
import { useSynthesisStore } from '@/stores/synthesis';

export function ParameterPanel() {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { params, setParam, seedLocked, setSeedLocked } = useSynthesisStore();

  return (
    <>
      {/* Primary controls */}
      <section className="card card--refinement">
        <h3 className="card-label">Synthesis Parameters</h3>

        <SliderControl
          label="Temperature"
          tooltip="Controls randomness. Lower = more deterministic, higher = more creative."
          value={params.temperature}
          min={0.1} max={1.0} step={0.05}
          displayValue={params.temperature.toFixed(2)}
          onChange={(v) => setParam('temperature', v)}
        />
        <SliderControl
          label="Top P"
          tooltip="Nucleus sampling. Controls diversity of token selection."
          value={params.top_p}
          min={0.1} max={1.0} step={0.05}
          displayValue={params.top_p.toFixed(2)}
          onChange={(v) => setParam('top_p', v)}
        />
        <SliderControl
          label="Repetition Penalty"
          tooltip="Penalizes repeated tokens. Higher values reduce repetitive speech."
          value={params.repetition_penalty}
          min={0.9} max={2.0} step={0.05}
          displayValue={params.repetition_penalty.toFixed(2)}
          onChange={(v) => setParam('repetition_penalty', v)}
        />
        <SeedInput
          seed={params.seed}
          locked={seedLocked}
          onSeedChange={(seed) => setParam('seed', seed)}
          onLockedChange={setSeedLocked}
        />
      </section>

      {/* Advanced controls */}
      <section className="card card--modifiers">
        <h3
          className="card-label"
          style={{ cursor: 'pointer' }}
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          Advanced Options {advancedOpen ? '\u25B2' : '\u25BC'}
        </h3>
        {advancedOpen && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <SliderControl
              label="Chunk Length"
              tooltip="Text chunk size for iterative generation. Higher = more coherent."
              value={params.chunk_length}
              min={100} max={300} step={10}
              onChange={(v) => setParam('chunk_length', v)}
            />
            <SliderControl
              label="Max New Tokens"
              tooltip="Maximum tokens generated. Higher = longer output, potentially lower quality."
              value={params.max_new_tokens}
              min={256} max={2048} step={64}
              onChange={(v) => setParam('max_new_tokens', v)}
            />
            <div className="modifiers-grid">
              <ToggleControl
                label="Normalize Text"
                tooltip="Normalize numbers and abbreviations for stability."
                checked={params.normalize}
                onChange={(v) => setParam('normalize', v)}
              />
              <ToggleControl
                label="Streaming"
                tooltip="Stream audio as it generates (WAV only)."
                checked={params.streaming}
                onChange={(v) => setParam('streaming', v)}
              />
              <ToggleControl
                label="Memory Cache"
                tooltip="Cache encoded reference audio for faster repeat synthesis."
                checked={params.use_memory_cache === 'on'}
                onChange={(v) => setParam('use_memory_cache', v ? 'on' : 'off')}
              />
            </div>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <label className="slider-label">Output Format</label>
              <select
                value={params.format}
                onChange={(e) => setParam('format', e.target.value as 'wav' | 'mp3')}
                style={{
                  background: 'var(--surface-highest)',
                  color: 'var(--on-surface)',
                  border: '2px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2) var(--space-3)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-body)',
                  marginTop: 'var(--space-2)',
                }}
              >
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
              </select>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
```

Write to `frontend/src/components/ParameterPanel.tsx`.

- [ ] **Step 5: Create useAudioPlayer.ts hook**

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const loadAudio = useCallback((url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    // Revoke previous object URL if it was one
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    audio.src = url;
    setAudioUrl(url);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [audioUrl]);

  const play = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const seekByFraction = useCallback((fraction: number) => {
    if (audioRef.current && duration > 0) {
      seek(fraction * duration);
    }
  }, [duration, seek]);

  return {
    audioUrl,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    play,
    pause,
    togglePlay,
    seek,
    seekByFraction,
  };
}
```

Write to `frontend/src/hooks/useAudioPlayer.ts`.

- [ ] **Step 6: Create AudioPlayer.tsx**

```tsx
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useEffect } from 'react';

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

interface AudioPlayerProps {
  url: string | null;
  autoPlay?: boolean;
}

export function AudioPlayer({ url, autoPlay }: AudioPlayerProps) {
  const player = useAudioPlayer();

  useEffect(() => {
    if (url) {
      player.loadAudio(url);
      if (autoPlay) {
        // Small delay to let audio load
        setTimeout(() => player.play(), 100);
      }
    }
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!url) {
    return (
      <section className="card card--preview">
        <h3 className="card-label">Synthesis Preview</h3>
        <div className="audio-waveform">
          <div className="audio-waveform-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span>No audio generated yet</span>
          </div>
        </div>
      </section>
    );
  }

  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <section className="card card--preview">
      <h3 className="card-label">Synthesis Preview</h3>
      <div className="audio-waveform">
        <div className={`audio-waveform-bars${player.isPlaying ? ' is-playing' : ''}`}>
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="bar"
              style={{
                height: `${8 + Math.sin(i * 0.7) * 20 + Math.cos(i * 1.3) * 15}px`,
                animationDelay: `${(i * 0.05) % 0.6}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="audio-controls">
        <button className="audio-btn" onClick={player.togglePlay} aria-label={player.isPlaying ? 'Pause' : 'Play'}>
          {player.isPlaying ? (
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <span className="audio-time">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>
        <div
          className="audio-progress-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            player.seekByFraction((e.clientX - rect.left) / rect.width);
          }}
        >
          <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <a className="audio-btn" href={url} download={`tavern-talk.wav`} aria-label="Download">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </section>
  );
}
```

Write to `frontend/src/components/AudioPlayer.tsx`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ frontend/src/hooks/
git commit -m "feat: add shared UI components — sliders, toggles, seed input, parameter panel, audio player"
```

---

## Task 9: Synthesis page (full implementation)

**Files:**
- Create: `frontend/src/hooks/useSynthesis.ts`
- Create: `frontend/src/components/VoiceSelector.tsx`
- Modify: `frontend/src/pages/Synthesis.tsx`

- [ ] **Step 1: Create useSynthesis.ts hook**

```typescript
import { useCallback } from 'react';
import { useSynthesisStore } from '@/stores/synthesis';
import { useToast } from '@/components/Toast';
import { synthesize } from '@/api/tts';
import { saveHistory, loadVoiceReferenceBase64 } from '@/api/files';
import type { TTSRequest } from '@/api/types';

export function useSynthesis() {
  const store = useSynthesisStore();
  const { showToast } = useToast();

  const generate = useCallback(async () => {
    const text = store.text.trim();
    if (!text) {
      showToast('Enter some text before synthesizing.', 'error');
      return;
    }

    store.setIsGenerating(true);

    try {
      const request: TTSRequest = {
        text,
        temperature: store.params.temperature,
        top_p: store.params.top_p,
        repetition_penalty: store.params.repetition_penalty,
        seed: store.seedLocked ? store.params.seed : store.params.seed,
        chunk_length: store.params.chunk_length,
        max_new_tokens: store.params.max_new_tokens,
        format: store.params.format,
        normalize: store.params.normalize,
        streaming: store.params.streaming,
        use_memory_cache: store.params.use_memory_cache,
      };

      // Attach voice reference if selected
      if (store.activeVoice && store.activeVoice.hasAudio) {
        const audioBase64 = await loadVoiceReferenceBase64(store.activeVoice.id);
        request.references = [{
          audio: audioBase64,
          text: store.activeVoice.transcript,
        }];
      }

      const blob = await synthesize(request);
      const audioUrl = URL.createObjectURL(blob);

      store.setLastResult(audioUrl, { ...store.params });

      // Auto-save to history
      try {
        await saveHistory(
          {
            text,
            voice: store.activeVoice?.id || 'default',
            params: { ...store.params },
            timestamp: new Date().toISOString(),
            duration_seconds: 0, // Will be updated when audio loads
            file_size_bytes: blob.size,
          },
          blob
        );
      } catch (historyErr) {
        console.warn('Failed to save to history:', historyErr);
      }

      // If seed is not locked, clear it for next generation
      if (!store.seedLocked) {
        store.setParam('seed', null);
      }

      showToast('Synthesis complete!', 'success');
    } catch (err) {
      console.error('Synthesis failed:', err);
      showToast(`Synthesis failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
      store.setLastResult(null, null);
    } finally {
      store.setIsGenerating(false);
    }
  }, [store, showToast]);

  return { generate };
}
```

Write to `frontend/src/hooks/useSynthesis.ts`.

- [ ] **Step 2: Create VoiceSelector.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVoices } from '@/api/files';
import { useSynthesisStore } from '@/stores/synthesis';
import type { VoiceProfile } from '@/api/types';

export function VoiceSelector() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const { activeVoice, setActiveVoice } = useSynthesisStore();

  useEffect(() => {
    listVoices().then(setVoices).catch(console.error);
  }, []);

  return (
    <section className="card card--voice">
      <div className="voice-avatar">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" fill="var(--surface-highest)" />
          <circle cx="40" cy="32" r="12" fill="var(--outline-variant)" />
          <path d="M20 64 Q40 48 60 64" fill="var(--outline-variant)" />
        </svg>
      </div>
      <div className="voice-info">
        <h3 className="voice-name">{activeVoice?.name || 'Default Voice'}</h3>
        <p className="voice-desc">
          {activeVoice?.description || 'No reference audio — uses model default'}
        </p>
        {activeVoice?.tags && activeVoice.tags.length > 0 && (
          <div className="voice-tags">
            {activeVoice.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <select
        value={activeVoice?.id || ''}
        onChange={(e) => {
          const voice = voices.find((v) => v.id === e.target.value) || null;
          setActiveVoice(voice);
        }}
        style={{
          width: '100%',
          background: 'var(--secondary-container)',
          color: 'var(--on-secondary-container)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <option value="">Default Voice (no reference)</option>
        {voices.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
      <Link to="/voices" className="btn btn--ghost" style={{ fontSize: 'var(--text-label)' }}>
        Manage voice profiles &rarr;
      </Link>
    </section>
  );
}
```

Write to `frontend/src/components/VoiceSelector.tsx`.

- [ ] **Step 3: Implement Synthesis.tsx**

```tsx
import { useSynthesisStore } from '@/stores/synthesis';
import { useSynthesis } from '@/hooks/useSynthesis';
import { ParameterPanel } from '@/components/ParameterPanel';
import { VoiceSelector } from '@/components/VoiceSelector';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { SynthesisParams } from '@/api/types';

function SettingsSnapshot({ params }: { params: SynthesisParams }) {
  const entries = Object.entries(params).filter(([, v]) => v !== null);
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-3)',
    }}>
      {entries.map(([key, value]) => (
        <span key={key} className="tag" style={{ fontSize: 'var(--text-label)' }}>
          {key}: {String(value)}
        </span>
      ))}
    </div>
  );
}

export function Synthesis() {
  const { text, setText, params, isGenerating, lastAudioUrl, lastParams } = useSynthesisStore();
  const { generate } = useSynthesis();

  const charCount = text.length;

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Voice Synthesis</h1>
        <p className="hero-sub">Transmute your script into atmospheric audio using our refined alchemical models.</p>
      </header>

      <div className="content-grid">
        <div className="col-left">
          {/* Text Input */}
          <section className="card card--input">
            <div className="card-header">
              <span className="card-label">Input Script</span>
              <span className="char-count">{charCount} / 5000 characters</span>
            </div>
            <textarea
              className="script-textarea"
              placeholder="Type or paste your arcane monologue here..."
              maxLength={5000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  generate();
                }
              }}
            />
            <div className="card-actions">
              <button className="btn btn--ghost" onClick={() => setText('')}>
                Clear
              </button>
            </div>
          </section>

          <ParameterPanel />
        </div>

        <div className="col-right">
          <VoiceSelector />

          <AudioPlayer url={lastAudioUrl} autoPlay />

          {lastParams && <SettingsSnapshot params={lastParams} />}

          <button
            className={`btn btn--cta${isGenerating ? ' is-loading' : ''}`}
            onClick={generate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Synthesizing\u2026' : 'Begin Synthesis'}
          </button>
        </div>
      </div>
    </>
  );
}
```

Write to `frontend/src/pages/Synthesis.tsx`.

- [ ] **Step 4: Verify in browser**

Open http://localhost:3000. Expected: full Synthesis page with text area, parameter sliders (Temperature, Top P, Repetition Penalty, Seed), advanced options panel, voice selector, audio player, and "Begin Synthesis" button. Type text, click "Begin Synthesis" — audio should generate and play.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: implement Synthesis page with full API parameter controls and voice selection"
```

---

## Task 10: Voices page

**Files:**
- Create: `frontend/src/components/VoiceCard.tsx`
- Modify: `frontend/src/pages/Voices.tsx`

- [ ] **Step 1: Create VoiceCard.tsx**

```tsx
import type { VoiceProfile } from '@/api/types';
import { getVoiceAudioUrl } from '@/api/files';

interface VoiceCardProps {
  voice: VoiceProfile;
  onEdit: (voice: VoiceProfile) => void;
  onDelete: (id: string) => void;
}

export function VoiceCard({ voice, onEdit, onDelete }: VoiceCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-title)', color: 'var(--on-surface)' }}>
            {voice.name}
          </h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--on-surface-muted)' }}>
            {voice.description}
          </p>
        </div>
        {voice.hasAudio && (
          <audio
            src={getVoiceAudioUrl(voice.id)}
            controls
            style={{ height: '30px', flexShrink: 0 }}
          />
        )}
      </div>
      {voice.tags.length > 0 && (
        <div className="voice-tags" style={{ justifyContent: 'flex-start' }}>
          {voice.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn--secondary" onClick={() => onEdit(voice)}>Edit</button>
        <button className="btn btn--ghost" onClick={() => onDelete(voice.id)}>Delete</button>
      </div>
    </div>
  );
}
```

Write to `frontend/src/components/VoiceCard.tsx`.

- [ ] **Step 2: Implement Voices.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { listVoices, saveVoice, deleteVoice } from '@/api/files';
import { transcribeAudio } from '@/api/asr';
import { useToast } from '@/components/Toast';
import { VoiceCard } from '@/components/VoiceCard';
import type { VoiceProfile } from '@/api/types';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function Voices() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [editing, setEditing] = useState<VoiceProfile | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { showToast } = useToast();

  const refresh = useCallback(() => {
    listVoices().then(setVoices).catch(console.error);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const startNew = () => {
    setEditing(null);
    setIsNew(true);
    setName('');
    setDescription('');
    setTags('');
    setTranscript('');
    setAudioFile(null);
  };

  const startEdit = (voice: VoiceProfile) => {
    setEditing(voice);
    setIsNew(false);
    setName(voice.name);
    setDescription(voice.description);
    setTags(voice.tags.join(', '));
    setTranscript(voice.transcript);
    setAudioFile(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Voice name is required.', 'error');
      return;
    }
    const id = editing?.id || slugify(name);
    try {
      await saveVoice(id, {
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        transcript: transcript.trim(),
      }, audioFile || undefined);
      showToast(`Voice "${name}" saved.`, 'success');
      setEditing(null);
      setIsNew(false);
      refresh();
    } catch (err) {
      showToast(`Failed to save: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVoice(id);
      showToast('Voice deleted.', 'success');
      refresh();
    } catch (err) {
      showToast(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      showToast('Upload an audio file first.', 'error');
      return;
    }
    setIsTranscribing(true);
    try {
      const text = await transcribeAudio(audioFile);
      setTranscript(text);
      showToast('Transcription complete!', 'success');
    } catch (err) {
      showToast(`Transcription failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsTranscribing(false);
    }
  };

  const showForm = isNew || editing !== null;

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Voice Profiles</h1>
        <p className="hero-sub">Upload reference audio to clone voices for your alchemical experiments.</p>
      </header>

      {!showForm && (
        <>
          <button className="btn btn--primary" onClick={startNew} style={{ marginBottom: 'var(--space-6)' }}>
            + New Voice Profile
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {voices.map((v) => (
              <VoiceCard key={v.id} voice={v} onEdit={startEdit} onDelete={handleDelete} />
            ))}
            {voices.length === 0 && (
              <p style={{ color: 'var(--on-surface-muted)' }}>No voice profiles yet. Create one to get started.</p>
            )}
          </div>
        </>
      )}

      {showForm && (
        <section className="card" style={{ maxWidth: '600px' }}>
          <h3 className="card-label">{isNew ? 'New Voice Profile' : `Edit: ${editing?.name}`}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <div>
              <label className="slider-label">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lyra Nocturne"
                className="script-textarea"
                style={{ minHeight: 'auto', padding: 'var(--space-2) var(--space-3)' }}
              />
            </div>
            <div>
              <label className="slider-label">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Deep & sultry narrator"
                className="script-textarea"
                style={{ minHeight: 'auto', padding: 'var(--space-2) var(--space-3)' }}
              />
            </div>
            <div>
              <label className="slider-label">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. narrative, mystery, dark"
                className="script-textarea"
                style={{ minHeight: 'auto', padding: 'var(--space-2) var(--space-3)' }}
              />
            </div>
            <div>
              <label className="slider-label">Reference Audio (WAV/MP3/FLAC, max 30s)</label>
              <input
                type="file"
                accept=".wav,.mp3,.flac,audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--space-2)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="slider-label">Transcript</label>
                <button
                  className="btn btn--secondary"
                  onClick={handleTranscribe}
                  disabled={!audioFile || isTranscribing}
                  style={{ fontSize: 'var(--text-label)' }}
                >
                  {isTranscribing ? 'Transcribing...' : 'Auto-transcribe'}
                </button>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Text spoken in the reference audio..."
                className="script-textarea"
                style={{ minHeight: '80px', marginTop: 'var(--space-2)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn--primary" onClick={handleSave}>Save</button>
              <button className="btn btn--ghost" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
```

Write to `frontend/src/pages/Voices.tsx`.

- [ ] **Step 3: Verify in browser**

Navigate to http://localhost:3000/voices. Expected: "No voice profiles yet" message with "+ New Voice Profile" button. Click it, fill in name/description/tags, upload an audio file, click "Auto-transcribe", save. Voice card should appear in the grid.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: implement Voices page with profile CRUD, audio upload, and auto-transcription"
```

---

## Task 11: History page

**Files:**
- Create: `frontend/src/components/HistoryRow.tsx`
- Modify: `frontend/src/pages/History.tsx`

- [ ] **Step 1: Create HistoryRow.tsx**

```tsx
import { useState } from 'react';
import { getHistoryAudioUrl } from '@/api/files';
import type { HistoryRecord } from '@/api/types';

interface HistoryRowProps {
  record: HistoryRecord;
  onUseSettings: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
}

export function HistoryRow({ record, onUseSettings, onDelete }: HistoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const textPreview = record.text.length > 80 ? record.text.slice(0, 80) + '...' : record.text;
  const date = new Date(record.timestamp);
  const timeStr = date.toLocaleString();

  return (
    <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-label)', color: 'var(--on-surface-muted)' }}>{timeStr}</span>
            <span className="tag">{record.voice}</span>
            <span style={{ fontSize: 'var(--text-label)', color: 'var(--on-surface-muted)' }}>
              {(record.file_size_bytes / 1024).toFixed(0)} KB
            </span>
          </div>
          <p style={{ color: 'var(--on-surface)', fontSize: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
            {expanded ? record.text : textPreview}
          </p>
        </div>
        <span style={{ color: 'var(--on-surface-muted)', marginLeft: 'var(--space-3)' }}>
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <audio src={getHistoryAudioUrl(record.id)} controls style={{ width: '100%', marginBottom: 'var(--space-3)' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            {Object.entries(record.params)
              .filter(([, v]) => v !== null)
              .map(([key, value]) => (
                <span key={key} className="tag" style={{ fontSize: 'var(--text-label)' }}>
                  {key}: {String(value)}
                </span>
              ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn--secondary" onClick={() => onUseSettings(record)}>
              Use these settings
            </button>
            <button className="btn btn--ghost" onClick={() => onDelete(record.id)}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Write to `frontend/src/components/HistoryRow.tsx`.

- [ ] **Step 2: Implement History.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listHistory, deleteHistory } from '@/api/files';
import { useSynthesisStore } from '@/stores/synthesis';
import { useToast } from '@/components/Toast';
import { HistoryRow } from '@/components/HistoryRow';
import type { HistoryRecord } from '@/api/types';

export function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const navigate = useNavigate();
  const { setParams, setParam, setText } = useSynthesisStore();
  const { showToast } = useToast();

  const refresh = useCallback(() => {
    listHistory().then(setRecords).catch(console.error);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUseSettings = (record: HistoryRecord) => {
    setParams(record.params);
    setText(record.text);
    if (record.params.seed !== null) {
      setParam('seed', record.params.seed);
    }
    showToast('Settings loaded. Navigating to Synthesis.', 'success');
    navigate('/');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id);
      showToast('History entry deleted.', 'success');
      refresh();
    } catch (err) {
      showToast(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Generation History</h1>
        <p className="hero-sub">Browse and replay your past alchemical transmutations.</p>
      </header>

      {records.length === 0 ? (
        <p style={{ color: 'var(--on-surface-muted)' }}>No generations yet. Head to Synthesis to create your first one.</p>
      ) : (
        records.map((record) => (
          <HistoryRow
            key={record.id}
            record={record}
            onUseSettings={handleUseSettings}
            onDelete={handleDelete}
          />
        ))
      )}
    </>
  );
}
```

Write to `frontend/src/pages/History.tsx`.

- [ ] **Step 3: Verify in browser**

Generate audio on the Synthesis page, then navigate to History. Expected: the generation appears with timestamp, text preview, voice, and file size. Expand it to see full text, all parameters, audio player, and action buttons. Click "Use these settings" — should navigate to Synthesis with all values pre-filled.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: implement History page with expandable rows and 'use these settings' navigation"
```

---

## Task 12: Settings page

**Files:**
- Modify: `frontend/src/pages/Settings.tsx`

- [ ] **Step 1: Implement Settings.tsx**

```tsx
import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/api/files';
import { healthCheck } from '@/api/tts';
import { useToast } from '@/components/Toast';
import { SliderControl } from '@/components/SliderControl';
import type { AppSettings, SynthesisParams } from '@/api/types';
import { DEFAULT_SETTINGS, DEFAULT_PARAMS } from '@/api/types';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [health, setHealth] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    getSettings()
      .then((s) => { if (s) setSettings(s); })
      .catch(console.error);
  }, []);

  const setDefaultParam = <K extends keyof SynthesisParams>(key: K, value: SynthesisParams[K]) => {
    setSettings((prev) => ({
      ...prev,
      defaultParams: { ...prev.defaultParams, [key]: value },
    }));
  };

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      showToast('Settings saved.', 'success');
    } catch (err) {
      showToast(`Failed to save: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    showToast('Settings reset to defaults.', 'success');
  };

  const handleHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const result = await healthCheck();
      setHealth(result.status);
      showToast(`API status: ${result.status}`, 'success');
    } catch (err) {
      setHealth('error');
      showToast(`Health check failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setHealthLoading(false);
    }
  };

  const p = settings.defaultParams;

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Settings</h1>
        <p className="hero-sub">Configure your default alchemical parameters.</p>
      </header>

      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* API Health */}
        <section className="card">
          <h3 className="card-label">API Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <button className="btn btn--secondary" onClick={handleHealthCheck} disabled={healthLoading}>
              {healthLoading ? 'Checking...' : 'Check API Health'}
            </button>
            {health && (
              <span style={{ color: health === 'ok' ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                {health === 'ok' ? 'Connected' : 'Error'}
              </span>
            )}
          </div>
        </section>

        {/* Default Parameters */}
        <section className="card">
          <h3 className="card-label">Default Synthesis Parameters</h3>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <SliderControl label="Temperature" value={p.temperature} min={0.1} max={1.0} step={0.05} displayValue={p.temperature.toFixed(2)} onChange={(v) => setDefaultParam('temperature', v)} />
            <SliderControl label="Top P" value={p.top_p} min={0.1} max={1.0} step={0.05} displayValue={p.top_p.toFixed(2)} onChange={(v) => setDefaultParam('top_p', v)} />
            <SliderControl label="Repetition Penalty" value={p.repetition_penalty} min={0.9} max={2.0} step={0.05} displayValue={p.repetition_penalty.toFixed(2)} onChange={(v) => setDefaultParam('repetition_penalty', v)} />
            <SliderControl label="Chunk Length" value={p.chunk_length} min={100} max={300} step={10} onChange={(v) => setDefaultParam('chunk_length', v)} />
            <SliderControl label="Max New Tokens" value={p.max_new_tokens} min={256} max={2048} step={64} onChange={(v) => setDefaultParam('max_new_tokens', v)} />

            <div style={{ marginTop: 'var(--space-3)' }}>
              <label className="slider-label">Default Output Format</label>
              <select
                value={settings.defaultFormat}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultFormat: e.target.value as 'wav' | 'mp3' }))}
                style={{
                  background: 'var(--surface-highest)', color: 'var(--on-surface)',
                  border: '2px solid transparent', borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-body)', marginTop: 'var(--space-2)',
                }}
              >
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
              </select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn--primary" onClick={handleSave}>Save Settings</button>
          <button className="btn btn--ghost" onClick={handleReset}>Reset to Defaults</button>
        </div>
      </div>
    </>
  );
}
```

Write to `frontend/src/pages/Settings.tsx`.

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/settings. Expected: API health check button (should return "Connected"), default parameter sliders, output format dropdown, save/reset buttons.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Settings.tsx
git commit -m "feat: implement Settings page with default params and API health check"
```

---

## Task 13: Docker prod profile

**Files:**
- Create: `frontend/Dockerfile.prod`
- Update: `frontend/nginx.conf`
- Update: `docker-compose.yml` (add frontend-prod service)

- [ ] **Step 1: Create Dockerfile.prod**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS server-deps
WORKDIR /opt/file-api
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM nginx:1.25-alpine
RUN apk add --no-cache nodejs
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=server-deps /opt/file-api/node_modules /opt/file-api/node_modules
COPY --from=build /app/server /opt/file-api/server
COPY --from=build /app/package.json /opt/file-api/
EXPOSE 80
CMD sh -c "cd /opt/file-api && node --import tsx server/file-api.ts & nginx -g 'daemon off;'"
```

Write to `frontend/Dockerfile.prod`.

- [ ] **Step 2: Update nginx.conf with /files proxy**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://api:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }

    location /files/ {
        proxy_pass http://localhost:3001/files/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Write to `frontend/nginx.conf`.

- [ ] **Step 3: Add frontend-prod to docker-compose.yml**

Add this service block after `frontend-dev` in `docker-compose.yml`:

```yaml
  # Production: nginx + Express file API
  frontend-prod:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:80"
    volumes:
      - ./voices:/data/voices
      - ./output:/data/output
    environment:
      - DATA_DIR=/data
    profiles: [prod]
    depends_on:
      - api
```

- [ ] **Step 4: Verify prod build**

```bash
docker compose --profile prod up --build
```

Expected: Build completes, site loads on http://localhost:3000 with all features working (synthesis, voices, history, settings).

- [ ] **Step 5: Commit**

```bash
git add frontend/Dockerfile.prod frontend/nginx.conf docker-compose.yml
git commit -m "feat: add Docker prod profile with nginx + Express file API"
```

---

## Task 14: Clean up old vanilla frontend

**Files:**
- Delete: `frontend/Dockerfile` (old single Dockerfile)
- Delete: `frontend/src/js/app.js`
- Delete: `frontend/src/index.html` (old, replaced by `frontend/index.html`)

- [ ] **Step 1: Remove old files**

```bash
rm -f frontend/Dockerfile frontend/src/js/app.js frontend/src/index.html
rmdir frontend/src/js 2>/dev/null || true
```

- [ ] **Step 2: Verify dev mode still works**

```bash
docker compose --profile dev up --build
```

Open http://localhost:3000 — everything should still work.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old vanilla HTML/JS frontend files"
```

---

## Task 15: End-to-end verification

Run through the complete verification checklist from the spec.

- [ ] **Step 1: Dev workflow hot-reload**

Start dev mode: `docker compose --profile dev up`

Edit any React component (e.g. change the hero title in `Synthesis.tsx`). The browser should update within 1-2 seconds without a page reload.

- [ ] **Step 2: Synthesis flow**

On the Synthesis page: type text, adjust Temperature/Top P/Repetition Penalty sliders, set a seed and lock it, click "Begin Synthesis". Audio should generate and play. Settings snapshot should display below the player.

- [ ] **Step 3: Seed reproducibility**

With seed locked, generate the same text twice. Both audio files should be identical (same file size is a good proxy).

- [ ] **Step 4: Voice upload flow**

Navigate to Voices → "New Voice Profile" → fill name/description → upload a WAV file → click "Auto-transcribe" → verify transcript fills in → Save. Return to Synthesis → select the new voice from the dropdown → generate. Audio should use the voice clone.

- [ ] **Step 5: History flow**

After generating a few clips, navigate to History. Entries should appear sorted newest-first. Expand one → play audio → click "Use these settings" → verify Synthesis page is pre-filled with those exact parameters.

- [ ] **Step 6: Settings persistence**

Navigate to Settings → change Temperature default to 0.5 → Save. Stop containers (`docker compose down`). Restart (`docker compose --profile dev up`). Navigate to Settings → Temperature should still be 0.5.

- [ ] **Step 7: Volume persistence**

Stop containers. Check that `voices/` and `output/` on the host contain the files you created. Restart containers — all data should be intact.

- [ ] **Step 8: Prod build**

```bash
docker compose --profile prod up --build
```

Open http://localhost:3000. All pages and features should work identically to dev mode.
