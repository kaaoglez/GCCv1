// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - ImageLightbox Component
// Full-size image viewer with zoom, thumbnails, and navigation
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
  alt?: string;
}

export function ImageLightbox({
  images,
  startIndex = 0,
  open,
  onClose,
  alt = '',
}: ImageLightboxProps) {
  // State initialized from props — component remounts via key when open/startIndex changes
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') onClose();
      if ((e.key === '+' || e.key === '=') && zoom < 3) setZoom((z) => z + 0.5);
      if (e.key === '-' && zoom > 1) setZoom((z) => z - 0.5);
      if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, goPrev, goNext, onClose, zoom]);

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.5, 3));
  const zoomOut = () => {
    if (zoom <= 1) return;
    setZoom((z) => z - 0.5);
    if (zoom - 0.5 <= 1) setPan({ x: 0, y: 0 });
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-w-6xl w-[calc(100%-1rem)] h-[calc(100%-2rem)] p-0 gap-0 overflow-hidden bg-black/95 border-white/10 [&>button]:hidden"
      >
        <DialogTitle className="sr-only">
          {alt || `Imagen ${currentIndex + 1} de ${images.length}`}
        </DialogTitle>

        <div className="relative w-full h-full flex flex-col">
          {/* Main image area */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center min-h-0">
            {/* Image */}
            <img
              src={images[currentIndex]}
              alt={alt || `${currentIndex + 1}`}
              className={cn(
                'max-w-full max-h-full object-contain transition-transform duration-200 select-none',
                isDragging && zoom > 1 ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
              )}
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center center',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}

            {/* Zoom controls — top right */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                disabled={zoom <= 1}
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              >
                <ZoomOut className="size-5" />
              </Button>
              <span className="text-xs text-white/60 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              >
                <ZoomIn className="size-5" />
              </Button>
            </div>

            {/* Image counter — top left */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              <ImageIcon className="size-3.5" />
              {currentIndex + 1} / {images.length}
            </div>

            {/* Zoom hint */}
            {zoom === 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/30 pointer-events-none">
                Usa scroll o botones para ampliar · Arrastra para mover
              </div>
            )}
          </div>

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="flex-shrink-0 px-3 py-3 bg-black/80 border-t border-white/10">
              <div className="flex gap-2 overflow-x-auto justify-center max-w-full pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className={cn(
                      'flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all',
                      i === currentIndex
                        ? 'border-primary opacity-100 scale-105'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    )}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
