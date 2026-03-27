import type { VoiceProfile, HistoryRecord, AppSettings } from './types';

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

export async function loadVoiceReferenceBase64(id: string): Promise<string> {
  const res = await fetch(getVoiceAudioUrl(id));
  if (!res.ok) throw new Error(`Failed to load voice audio: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
}
