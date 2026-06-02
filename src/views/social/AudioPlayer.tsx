import { useRef, useState } from 'react';

type AudioPlayerProps = {
  src: string;
  compact?: boolean;
};

export function AudioPlayer({ src, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  return (
    <div className={`voice-note-player ${compact ? 'compact' : ''}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={event => setCurrent(event.currentTarget.currentTime)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button className="voice-play-button" type="button" onClick={toggleAudio} aria-label={playing ? 'Pausar audio' : 'Ouvir audio'}>
        <span className={playing ? 'pause-icon' : 'play-icon'} />
      </button>
      <div className="voice-wave-wrap">
        <div className={`audio-wave ${playing ? 'playing' : ''}`} aria-hidden="true">
          {Array.from({ length: 24 }).map((_, index) => <span key={index} />)}
        </div>
        <input
          className="form-range"
          aria-label="Linha do tempo do audio"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={current}
          onChange={event => seek(Number(event.target.value))}
        />
      </div>
      <span>{formatAudioTime(current || duration)}</span>
    </div>
  );
}

function formatAudioTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
