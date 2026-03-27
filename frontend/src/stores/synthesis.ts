import { create } from 'zustand';
import type { SynthesisParams, VoiceProfile } from '@/api/types';
import { DEFAULT_PARAMS } from '@/api/types';

interface SynthesisState {
  params: SynthesisParams;
  setParam: <K extends keyof SynthesisParams>(key: K, value: SynthesisParams[K]) => void;
  setParams: (params: Partial<SynthesisParams>) => void;
  resetParams: () => void;

  text: string;
  setText: (text: string) => void;

  seedLocked: boolean;
  setSeedLocked: (locked: boolean) => void;

  activeVoice: VoiceProfile | null;
  setActiveVoice: (voice: VoiceProfile | null) => void;

  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;

  lastAudioUrl: string | null;
  lastParams: SynthesisParams | null;
  setLastResult: (audioUrl: string | null, params: SynthesisParams | null) => void;

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
