import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onEnded: () => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ audioUrl, isPlaying, onEnded }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Initialize Audio
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    audio.onended = () => {
        onEnded();
    };

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 128; // Lower FFT size for chunkier, more "digital" bars
            analyserRef.current.smoothingTimeConstant = 0.8;
            
            sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
        }
    };

    // Initialize context (may require user gesture in some browsers, but we call it here for setup)
    initAudioContext();

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current || !audioContextRef.current) return;

    if (isPlaying) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().catch(e => console.error("Playback error:", e));
      draw();
    } else {
      audioRef.current.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const draw = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ctx.fillStyle = '#0F0F11';
      // ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5; // Slight overlap or spacing
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        
        // Studio Accent colors
        gradient.addColorStop(0, 'rgba(0, 220, 130, 0.2)');
        gradient.addColorStop(0.5, 'rgba(0, 220, 130, 0.8)');
        gradient.addColorStop(1, '#ffffff');

        ctx.fillStyle = gradient;
        
        // Rounded tops
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 4);
        ctx.fill();

        x += barWidth;
      }
    };

    renderFrame();
  };

  return (
    <div className="w-full h-32 bg-studio-surface rounded-xl overflow-hidden border border-white/5 relative">
        {/* Grid Overlay for "Studio" look */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
        </div>
        
        <canvas 
            ref={canvasRef} 
            width={600} 
            height={128}
            className="w-full h-full relative z-10"
        />
    </div>
  );
};

export default Visualizer;