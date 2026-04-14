import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Photo } from '@/types';
import clsx from 'clsx';

interface Props {
  photos: Photo[];
  onUpload: (file: File) => void;
  onDelete: (photoId: string) => void;
  onSetMain: (photoId: string) => void;
  isUploading?: boolean;
}

export default function PhotoUploader({ photos, onUpload, onDelete, onSetMain, isUploading }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach((f) => onUpload(f));
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  return (
    <div className="space-y-4">
      {/* Photos grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-parchment-100">
              <img
                src={photo.path}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Main badge */}
              {photo.isMain && (
                <span className="absolute top-2 left-2 bg-parchment-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  Principale
                </span>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1.5">
                {!photo.isMain && (
                  <button
                    onClick={() => onSetMain(photo.id)}
                    className="flex-1 bg-white/90 text-parchment-800 text-xs py-1.5 rounded-lg font-medium hover:bg-white transition-colors"
                  >
                    Principale
                  </button>
                )}
                <button
                  onClick={() => onDelete(photo.id)}
                  className="bg-terracotta-400/90 text-white text-xs py-1.5 px-2.5 rounded-lg font-medium hover:bg-terracotta-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-parchment-500 bg-parchment-50'
            : 'border-parchment-200 hover:border-parchment-400 hover:bg-parchment-50/50'
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="space-y-2">
            <div className="text-2xl animate-spin inline-block">⏳</div>
            <p className="text-sm text-parchment-500">Téléversement en cours…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">{isDragActive ? '📥' : '📷'}</div>
            <p className="text-sm font-medium text-parchment-600">
              {isDragActive ? 'Déposez ici' : 'Glissez des photos ou cliquez'}
            </p>
            <p className="text-xs text-parchment-400">JPG, PNG, WebP · Max 10 Mo</p>
          </div>
        )}
      </div>
    </div>
  );
}