import { GuidedTour, type TourStep } from "@/components/GuidedTour";

const homeTourSteps: TourStep[] = [
  {
    target: "[data-tour='hero-search']",
    title: "Search for Properties",
    content: "Start here! Type your campus name or area, pick a property type and budget, then hit 'Find Properties' to see results instantly.",
    placement: "bottom",
  },
  {
    target: "[data-tour='campus-cards']",
    title: "Quick Campus Links",
    content: "Or just tap any campus card to jump straight to properties near that school. No typing needed!",
    placement: "bottom",
  },
  {
    target: "[data-tour='featured-properties']",
    title: "Featured Properties",
    content: "Browse our top verified properties here. Click any card to see photos, prices, and room details. You can save favorites too!",
    placement: "top",
  },
];

export function HomeTour() {
  return <GuidedTour tourId="homepage" steps={homeTourSteps} delay={1200} />;
}
