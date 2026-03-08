import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Lightbulb } from "lucide-react";

export interface TourStep {
  /** CSS selector for the target element */
  target: string;
  /** Title of the tooltip */
  title: string;
  /** Description text */
  content: string;
  /** Tooltip placement relative to target */
  placement?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  /** Unique key for localStorage tracking */
  tourId: string;
  /** Array of tour steps */
  steps: TourStep[];
  /** Delay before auto-starting (ms) */
  delay?: number;
  /** Called when tour completes or is skipped */
  onComplete?: () => void;
}

function getTooltipPosition(rect: DOMRect, placement: string, tooltipW: number, tooltipH: number) {
  const gap = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;

  switch (placement) {
    case "bottom":
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case "top":
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + gap;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      break;
  }

  // Clamp within viewport
  left = Math.max(12, Math.min(left, vw - tooltipW - 12));
  top = Math.max(12, Math.min(top, vh - tooltipH - 12));

  return { top, left };
}

export function GuidedTour({ tourId, steps, delay = 800, onComplete }: GuidedTourProps) {
  const storageKey = `tour_completed_${tourId}`;
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour was already completed
  useEffect(() => {
    if (localStorage.getItem(storageKey)) return;
    const timer = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(timer);
  }, [storageKey, delay]);

  const positionTooltip = useCallback(() => {
    if (!active || !steps[currentStep]) return;
    const el = document.querySelector(steps[currentStep].target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setSpotlightRect(rect);

    // Scroll into view if needed
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait a tick for tooltip to render so we can measure it
    requestAnimationFrame(() => {
      const tooltipEl = tooltipRef.current;
      const tooltipW = tooltipEl?.offsetWidth || 320;
      const tooltipH = tooltipEl?.offsetHeight || 160;
      const placement = steps[currentStep].placement || "bottom";
      setTooltipPos(getTooltipPosition(rect, placement, tooltipW, tooltipH));
    });
  }, [active, currentStep, steps]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [positionTooltip]);

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, "true");
    setActive(false);
    onComplete?.();
  }, [storageKey, onComplete]);

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
    else finish();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!active || !steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Overlay with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            onClick={finish}
          >
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id={`tour-mask-${tourId}`}>
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {spotlightRect && (
                    <rect
                      x={spotlightRect.left - 6}
                      y={spotlightRect.top - 6}
                      width={spotlightRect.width + 12}
                      height={spotlightRect.height + 12}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0" y="0" width="100%" height="100%"
                fill="hsl(220, 25%, 6%)"
                fillOpacity="0.6"
                mask={`url(#tour-mask-${tourId})`}
              />
            </svg>
          </motion.div>

          {/* Spotlight ring */}
          {spotlightRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed z-[9999] pointer-events-none rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
              style={{
                top: spotlightRect.top - 6,
                left: spotlightRect.left - 6,
                width: spotlightRect.width + 12,
                height: spotlightRect.height + 12,
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-[10000] w-80 max-w-[calc(100vw-24px)]"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border shadow-xl rounded-xl p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-sm">{step.title}</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={finish}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Content */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4 pl-9">
                {step.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pl-9">
                {/* Step indicator */}
                <div className="flex items-center gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentStep ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  {!isFirst && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={prev}>
                      <ChevronLeft className="h-3 w-3 mr-0.5" /> Back
                    </Button>
                  )}
                  {isFirst && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground" onClick={finish}>
                      Skip tour
                    </Button>
                  )}
                  <Button size="sm" className="h-7 text-xs px-3 gradient-primary text-primary-foreground" onClick={next}>
                    {isLast ? "Got it!" : "Next"}
                    {!isLast && <ChevronRight className="h-3 w-3 ml-0.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Reset a specific tour so it shows again */
export function resetTour(tourId: string) {
  localStorage.removeItem(`tour_completed_${tourId}`);
}

/** Reset all tours */
export function resetAllTours() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("tour_completed_")) localStorage.removeItem(key);
  });
}
