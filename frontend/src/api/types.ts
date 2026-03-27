// Fish Speech TTS API types

export interface TTSRequest {
  text: string;
  chunk_length?: number;
  format?: 'wav' | 'mp3' | 'pcm';
  references?: AudioReference[];
  reference_id?: string | null;
  seed?: number | null;
  use_memory_cache?: 'on' | 'off';
  normalize?: boolean;
  streaming?: boolean;
  max_new_tokens?: number;
  top_p?: number;
  repetition_penalty?: number;
  temperature?: number;
}

export interface AudioReference {
  audio: string;
  text: string;
}

export interface ASRRequest {
  audios: string[];
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
  id: string;
  name: string;
  description: string;
  tags: string[];
  transcript: string;
  hasAudio: boolean;
}

export interface HistoryRecord {
  id: string;
  text: string;
  voice: string;
  params: SynthesisParams;
  timestamp: string;
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
