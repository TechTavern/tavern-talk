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
      // Always use a seed so every generation is reproducible.
      // If the user hasn't set one, generate a random one.
      const seed = store.params.seed ?? Math.floor(Math.random() * 2147483647);

      // Build the complete params snapshot with the seed included.
      // We can't rely on store.params after setParam because the
      // hook closure holds a stale reference from render time.
      const generationParams = {
        ...store.params,
        seed,
        temperature: parseFloat(store.params.temperature.toFixed(2)),
        top_p: parseFloat(store.params.top_p.toFixed(2)),
        repetition_penalty: parseFloat(store.params.repetition_penalty.toFixed(2)),
      };

      const request: TTSRequest = {
        text,
        ...generationParams,
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

      store.setLastResult(audioUrl, generationParams);

      try {
        await saveHistory(
          {
            text,
            voice: store.activeVoice?.id || 'default',
            params: generationParams,
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
