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
