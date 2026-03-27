import type { ASRResponse } from './types';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
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
