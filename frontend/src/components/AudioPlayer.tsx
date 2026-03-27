import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useEffect } from 'react';
import { IconPlayerPlay, IconPlayerPause, IconDownload, IconMusic } from '@tabler/icons-react';

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
            <IconMusic size={32} stroke={1.5} />
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
          {player.isPlaying ? <IconPlayerPause size={20} stroke={1.5} /> : <IconPlayerPlay size={20} stroke={1.5} />}
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
        <a className="audio-btn" href={url} download="tavern-talk.wav" aria-label="Download">
          <IconDownload size={18} stroke={1.5} />
        </a>
      </div>
    </section>
  );
}
