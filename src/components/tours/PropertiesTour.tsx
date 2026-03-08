import { GuidedTour, type TourStep } from "@/components/GuidedTour";

const steps: TourStep[] = [
  {
    target: "[data-tour='properties-search']",
    title: "Search Properties",
    content: "Type a campus name, area, or property name to find accommodations. Results update instantly as you type.",
    placement: "bottom",
  },
  {
    target: "[data-tour='properties-filters']",
    title: "Filter Results",
    content: "Tap Filters to narrow by property type, max budget, and facilities. The badge shows how many filters are active.",
    placement: "bottom",
  },
  {
    target: "[data-tour='properties-views']",
    title: "List or Map View",
    content: "Switch between List and Map views. You can also view your Saved properties here. Tap the ❤️ on any card to save it!",
    placement: "bottom",
  },
];

export function PropertiesTour() {
  return <GuidedTour tourId="properties" steps={steps} delay={800} />;
}
