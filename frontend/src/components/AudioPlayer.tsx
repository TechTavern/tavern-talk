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
        <a className="audio-btn" href={url} download="tavern-talk.wav" aria-label="Download">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </section>
  );
}
