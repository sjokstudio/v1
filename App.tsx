import React, { useState, useEffect } from 'react';
import { AnalysisResult, AnalysisStatus, AudioFile } from './types.ts';
import DropZone from './components/DropZone.tsx';
import Visualizer from './components/Visualizer.tsx';
import { fileToBase64 } from './utils/audioUtils.ts';
import { analyzeAudioWithGemini } from './services/geminiService.ts';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (audioFile?.previewUrl) {
        URL.revokeObjectURL(audioFile.previewUrl);
      }
    };
  }, [audioFile]);

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert("文件过大 (限制 20MB)");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAudioFile({ file, previewUrl });
    setResult(null);
    setStatus(AnalysisStatus.READING);
    setErrorMsg("");

    try {
      const base64Data = await fileToBase64(file);
      setStatus(AnalysisStatus.ANALYZING);

      const analysisData = await analyzeAudioWithGemini(base64Data, file.type || 'audio/mp3');
      
      setResult(analysisData);
      setStatus(AnalysisStatus.COMPLETED);
      setIsPlaying(true);
    } catch (e: any) {
      setStatus(AnalysisStatus.ERROR);
      setErrorMsg(e.message || "分析引擎连接失败");
    }
  };

  const handleReset = () => {
    setStatus(AnalysisStatus.IDLE);
    setAudioFile(null);
    setResult(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-studio-bg text-studio-text">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-studio-accent/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-studio-secondary/5 rounded-full blur-[120px]"></div>
      </div>

      <main className="w-full max-w-3xl relative z-10">
        
        {/* Header Section */}
        <div className="flex items-end justify-between mb-8 px-2">
            <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white font-sans italic">
                  SJoK <span className="text-studio-accent not-italic">Studio</span>
                </h1>
                <p className="text-studio-muted text-xs md:text-sm font-mono mt-1 tracking-widest uppercase opacity-70">
                  Advanced Audio Analysis Terminal
                </p>
            </div>
            <div className="text-right hidden md:block">
                <div className="text-[10px] text-studio-muted font-mono bg-studio-surface border border-studio-border px-2 py-1 rounded">
                    v1.0.0 STABLE
                </div>
            </div>
        </div>

        {/* Main Interface Card */}
        <div className="glass-panel rounded-2xl p-1 md:p-2 shadow-2xl transition-all duration-500">
            <div className="bg-studio-surface/50 rounded-xl border border-white/5 p-6 md:p-10 min-h-[400px] flex flex-col justify-center">
                
                {/* IDLE STATE */}
                {status === AnalysisStatus.IDLE && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <DropZone onFileSelect={handleFileSelect} disabled={false} />
                    </div>
                )}

                {/* PROCESSING STATE */}
                {(status === AnalysisStatus.READING || status === AnalysisStatus.ANALYZING) && (
                    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
                        <div className="relative w-32 h-32 mb-8">
                            {/* Spinning Rings */}
                            <div className="absolute inset-0 border-2 border-studio-border rounded-full"></div>
                            <div className="absolute inset-0 border-t-2 border-studio-accent rounded-full animate-spin"></div>
                            <div className="absolute inset-4 border-b-2 border-studio-secondary rounded-full animate-spin-slow"></div>
                            
                            {/* Center Icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-mono text-xs text-studio-accent animate-pulse">Processing</span>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white tracking-wide">
                            {status === AnalysisStatus.READING ? "读取数据流..." : "Gemini 引擎分析中"}
                        </h3>
                        <p className="text-sm text-studio-muted mt-2 font-mono">
                            {status === AnalysisStatus.READING ? "BUFFERING AUDIO DATA" : "CALCULATING BPM & KEY TONALITY"}
                        </p>
                    </div>
                )}

                {/* ERROR STATE */}
                {status === AnalysisStatus.ERROR && (
                    <div className="text-center py-12 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="inline-flex p-4 rounded-full bg-studio-error/10 text-studio-error mb-6 ring-1 ring-studio-error/30">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                        <p className="text-studio-muted mb-8 max-w-md mx-auto">{errorMsg}</p>
                        <button 
                            onClick={handleReset}
                            className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-studio-accent transition-colors"
                        >
                            重试
                        </button>
                    </div>
                )}

                {/* RESULT STATE */}
                {status === AnalysisStatus.COMPLETED && result && audioFile && (
                    <div className="w-full animate-in fade-in duration-700">
                        
                        {/* Track Info Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                            <div className="overflow-hidden">
                                <h2 className="text-xl font-bold text-white truncate max-w-md" title={audioFile.file.name}>
                                    {audioFile.file.name}
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] bg-studio-panel px-2 py-0.5 rounded text-studio-muted border border-white/5 font-mono">
                                        {(audioFile.file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    <span className="text-[10px] text-studio-muted font-mono uppercase">
                                        {audioFile.file.type.split('/')[1] || 'AUDIO'}
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`
                                    flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all
                                    ${isPlaying 
                                        ? 'bg-studio-accent text-black shadow-[0_0_20px_rgba(0,220,130,0.3)]' 
                                        : 'bg-studio-panel text-white hover:bg-white hover:text-black border border-white/10'
                                    }
                                `}
                            >
                                {isPlaying ? (
                                    <>
                                        <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span> 暂停
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> 播放
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Visualizer */}
                        <div className="mb-8">
                            <Visualizer 
                                audioUrl={audioFile.previewUrl} 
                                isPlaying={isPlaying} 
                                onEnded={() => setIsPlaying(false)}
                            />
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {/* BPM Card */}
                            <div className="group relative bg-studio-panel/50 border border-white/5 rounded-xl p-6 overflow-hidden hover:border-studio-accent/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.55-11.5c-.28 0-.53.11-.71.29l-3.29 3.29c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l3.29 3.29c.18.18.43.29.71.29.55 0 1-.45 1-1v-2h4c.55 0 1-.45 1-1s-.45-1-1-1h-4v-2c0-.55-.45-1-1-1z"/></svg>
                                </div>
                                <div className="flex flex-col h-full justify-between">
                                    <p className="text-studio-muted text-xs font-mono uppercase tracking-widest mb-2">Tempo</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums">
                                            {Math.round(result.bpm)}
                                        </span>
                                        <span className="text-studio-accent font-bold text-lg">BPM</span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Card */}
                            <div className="group relative bg-studio-panel/50 border border-white/5 rounded-xl p-6 overflow-hidden hover:border-studio-secondary/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                                </div>
                                <div className="flex flex-col h-full justify-between">
                                    <p className="text-studio-muted text-xs font-mono uppercase tracking-widest mb-2">Key</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                                            {result.key}
                                        </span>
                                    </div>
                                    {/* Camelot Wheel or additional info could go here */}
                                </div>
                            </div>
                        </div>

                        {/* Analysis Text */}
                        <div className="bg-studio-panel/30 border border-white/5 rounded-xl p-6 relative">
                            <div className="absolute -top-3 left-6">
                                <span className="bg-studio-secondary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-studio-secondary/20">
                                    AI Report
                                </span>
                            </div>
                            <p className="text-studio-text/90 leading-relaxed font-light mt-2">
                                {result.description || "分析完成，暂无详细描述。"}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                            <button 
                                onClick={handleReset}
                                className="text-studio-muted hover:text-white text-sm font-mono flex items-center gap-2 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                RESET / NEW ANALYSIS
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
            <p className="text-[10px] text-studio-muted/40 font-mono tracking-widest uppercase">
                SJoK Studio v1.0 • Powered by Google Gemini 2.5 • Client-Side Processing
            </p>
        </footer>

      </main>
    </div>
  );
};

export default App;