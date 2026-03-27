import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || '/data';
const VOICES_DIR = path.join(DATA_DIR, 'voices');
const OUTPUT_DIR = path.join(DATA_DIR, 'output');

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
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.json') && f !== 'settings.json');
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
