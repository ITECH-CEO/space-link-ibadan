import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyCarouselProps {
  photos: string[];
  alt: string;
}

export function PropertyCarousel({ photos, alt }: PropertyCarouselProps) {
  const [current, setCurrent] = useState(0);
  const images = photos.length > 0 ? photos : ["/placeholder.svg"];

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  };

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted group">
      <img
        src={images[current]}
        alt={`${alt} - Photo ${current + 1}`}
        className="h-full w-full object-cover transition-transform duration-300"
        loading="lazy"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-card"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-card"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 rounded-full transition-all ${
                  i === current ? "w-4 bg-card" : "w-1.5 bg-card/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
