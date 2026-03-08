import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: string[];
  alt: string;
}

export function ImageLightbox({ images, alt }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const prev = () => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => { setActiveIndex(i); setOpen(true); }}
            className="group relative overflow-hidden rounded-xl aspect-video bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={url}
              alt={`${alt} photo ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
          <div className="relative flex flex-col">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-20 bg-background/60 hover:bg-background/80 rounded-full"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Main image */}
            <div className="relative flex items-center justify-center min-h-[50vh] max-h-[75vh] bg-muted/20">
              <img
                src={images[activeIndex]}
                alt={`${alt} photo ${activeIndex + 1}`}
                className="max-h-[75vh] max-w-full object-contain"
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 rounded-full"
                    onClick={prev}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 rounded-full"
                    onClick={next}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto justify-center bg-card/50">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "shrink-0 h-14 w-20 rounded-md overflow-hidden border-2 transition-all",
                      i === activeIndex ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Counter */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-background/70 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-muted-foreground">
              {activeIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
