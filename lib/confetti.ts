import confetti from "canvas-confetti";

export function triggerCelebration() {
  if (typeof window === "undefined") return;
  try {
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6"],
    });
  } catch {
    // ignore
  }
}
