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

      try {
        await saveHistory(
          {
            text,
            voice: store.activeVoice?.id || 'default',
            params: { ...store.params },
            timestamp: new Date().toISOString(),
            duration_seconds: 0,
            file_size_bytes: blob.size,
          },
          blob
        );
      } catch (historyErr) {
        console.warn('Failed to save to history:', historyErr);
      }

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
