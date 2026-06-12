import { useState, useRef } from 'react';
import { X, Upload, Camera } from 'lucide-react';
import type { TrashAnalysisResult, AnalyzeResponse } from '../App';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeSuccess: (result: TrashAnalysisResult, imageUrl: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';

export default function ScanModal({ isOpen, onClose, onAnalyzeSuccess }: ScanModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const payload: AnalyzeResponse = await response.json();

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? 'Gagal menganalisis gambar.');
      }

      const imageUrl = URL.createObjectURL(file);
      onAnalyzeSuccess(payload.data, imageUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menganalisis gambar.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      void analyzeFile(file);
    } else {
      setError('File harus berupa gambar (JPG, PNG, WEBP).');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-black-900">Scan Sampah</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-5">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => !isAnalyzing && inputRef.current?.click()}
              className={`relative rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-12 ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                  : 'border-gray-200 bg-gray-50 hover:border-emerald-400'
              } ${isAnalyzing ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center">
                <Upload size={28} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 text-sm">
                  {isAnalyzing ? 'Menganalisis...' : 'Upload Foto Sampah'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAnalyzing ? 'Mohon tunggu sebentar' : 'Drag & drop atau tap di sini'}
                </p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />

            {/* Camera Button */}
            <button
              type="button"
              disabled={isAnalyzing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Camera size={18} /> Gunakan Kamera
            </button>

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
