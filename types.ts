export interface AnalysisResult {
  bpm: number;
  key: string;
  confidence?: string;
  description?: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  READING = 'READING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AudioFile {
  file: File;
  previewUrl: string;
  duration?: number;
}