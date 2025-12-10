import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndPass(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files[0]);
    }
  };

  const validateAndPass = (file: File) => {
    if (file.type.startsWith('audio/')) {
        onFileSelect(file);
    } else {
        alert("请上传有效的音频文件 (MP3, WAV, FLAC, AAC)");
    }
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-72 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group overflow-hidden
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${isDragOver 
            ? 'bg-studio-accent/5 ring-1 ring-studio-accent' 
            : 'bg-studio-panel/50 hover:bg-studio-panel hover:ring-1 hover:ring-white/10'
        }
        border border-dashed 
        ${isDragOver ? 'border-studio-accent' : 'border-studio-muted/30'}
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        accept="audio/*"
        className="hidden"
        disabled={disabled}
      />
      
      {/* Background Decor */}
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-studio-accent/5 opacity-0 transition-opacity duration-500 ${isDragOver ? 'opacity-100' : 'group-hover:opacity-50'}`}></div>
      
      <div className="relative z-10 text-center p-8 pointer-events-none transform transition-transform duration-300 group-hover:scale-105">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 ${isDragOver ? 'bg-studio-accent text-black shadow-[0_0_30px_rgba(0,220,130,0.4)]' : 'bg-studio-surface border border-white/10 text-studio-muted group-hover:text-white group-hover:border-studio-accent/50'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
           </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-studio-text mb-3 font-sans tracking-tight">
            {isDragOver ? "释放以加载音频" : "导入音频文件"}
        </h3>
        <p className="text-sm text-studio-muted font-mono tracking-wide">
          拖拽文件至此 或 点击浏览
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-studio-muted/60 font-mono uppercase tracking-widest">
            <span>MP3</span>
            <span>•</span>
            <span>WAV</span>
            <span>•</span>
            <span>FLAC</span>
            <span>•</span>
            <span>AIFF</span>
        </div>
      </div>
    </div>
  );
};

export default DropZone;