import { useRef, useState, useCallback, useEffect } from "react";
import { Maximize2, Minimize2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PanoramaViewerProps {
  images: string[];
  className?: string;
}

export function PanoramaViewer({ images, className }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [currentRotX, setCurrentRotX] = useState(0);
  const [currentRotY, setCurrentRotY] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const animRef = useRef<number>();

  // Auto-rotate
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const animate = () => {
      setRotationX((prev) => prev + 0.15);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [autoRotate, isDragging]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setStartX(e.clientX);
    setStartY(e.clientY);
    setCurrentRotX(rotationX);
    setCurrentRotY(rotationY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [rotationX, rotationY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setRotationX(currentRotX + dx * 0.3);
    setRotationY(Math.max(-40, Math.min(40, currentRotY - dy * 0.3)));
  }, [isDragging, startX, startY, currentRotX, currentRotY]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setRotationX(0);
    setRotationY(0);
    setAutoRotate(true);
  };

  if (images.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-foreground/5 cursor-grab active:cursor-grabbing select-none"
        style={{ height: isFullscreen ? "100vh" : "400px" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Panoramic image with CSS transform */}
        <div
          className="absolute inset-0 w-[200%] h-[150%]"
          style={{
            backgroundImage: `url(${images[currentIndex]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translate(${-50 + rotationX * 0.2}%, ${-25 + rotationY * 0.2}%)`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        />

        {/* Overlay controls */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); resetView(); }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* 360° badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
            🔄 360° View
          </span>
        </div>

        {/* Drag hint */}
        {autoRotate && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground">
              Drag to explore
            </span>
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm z-10"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); resetView(); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm z-10"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); resetView(); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); resetView(); }}
              className={cn(
                "flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors",
                i === currentIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt={`Panorama ${i + 1}`} className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
