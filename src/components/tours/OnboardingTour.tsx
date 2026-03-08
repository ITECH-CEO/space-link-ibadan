import { GuidedTour, type TourStep } from "@/components/GuidedTour";

const steps: TourStep[] = [
  {
    target: "[data-tour='onboarding-progress']",
    title: "3 Quick Steps",
    content: "Just 3 short steps — your name & gender, then preferences, then you're done. Takes under a minute!",
    placement: "bottom",
  },
  {
    target: "[data-tour='onboarding-form']",
    title: "Only Name & Gender Required",
    content: "Fill in your name and gender to proceed. Everything else (faculty, phone, course) is optional — you can add it later from your Profile.",
    placement: "top",
  },
  {
    target: "[data-tour='onboarding-next']",
    title: "Tap Next When Ready",
    content: "Hit Next to set your budget and lifestyle preferences. Then we'll match you with the best properties!",
    placement: "top",
  },
];

export function OnboardingTour() {
  return <GuidedTour tourId="onboarding" steps={steps} delay={600} />;
}
