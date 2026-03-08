import { GuidedTour, type TourStep } from "@/components/GuidedTour";

const steps: TourStep[] = [
  {
    target: "[data-tour='inspection-progress']",
    title: "3 Simple Steps",
    content: "Pick a date & time, review the details, then confirm. No payment needed — inspections are free!",
    placement: "bottom",
  },
  {
    target: "[data-tour='inspection-calendar']",
    title: "Pick a Date",
    content: "Only dates with available slots are clickable. Select a date, then choose a time slot below it.",
    placement: "right",
  },
];

export function InspectionTour() {
  return <GuidedTour tourId="inspection" steps={steps} delay={500} />;
}
