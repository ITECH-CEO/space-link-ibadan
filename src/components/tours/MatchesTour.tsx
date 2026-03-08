import { GuidedTour, type TourStep } from "@/components/GuidedTour";

const steps: TourStep[] = [
  {
    target: "[data-tour='matches-tabs']",
    title: "Properties & Roommates",
    content: "Switch between your Property matches and Roommate matches here. Each tab shows matches tailored to your profile.",
    placement: "bottom",
  },
  {
    target: "[data-tour='roommate-find']",
    title: "Find a Roommate",
    content: "Tap this to run AI-powered matching. We'll find compatible students based on your course, faculty, and lifestyle preferences.",
    placement: "bottom",
  },
  {
    target: "[data-tour='roommate-swipe']",
    title: "Swipe to Decide",
    content: "Switch to card view to swipe right (Like) or left (Pass). When both of you like each other, it's a mutual match and you can message!",
    placement: "bottom",
  },
];

export function MatchesTour() {
  return <GuidedTour tourId="matches" steps={steps} delay={800} />;
}
