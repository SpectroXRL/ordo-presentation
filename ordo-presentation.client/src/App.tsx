import { useEffect, useState, useSyncExternalStore } from "react";
import { presentationStore } from "./store/PresentationStore";
import { SlideList } from "./components/SlideList";
import { Canvas } from "./components/Canvas";
import { ChatPanel } from "./components/ChatPanel";
import "./App.css";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const slides = useSyncExternalStore(
    presentationStore.subscribe,
    presentationStore.getSlides,
  );
  const activeSlideId = useSyncExternalStore(
    presentationStore.subscribe,
    presentationStore.getActiveSlideId,
  );
  const activeSlide =
    slides.find((slide) => slide.id === activeSlideId) ?? slides[0];

  return (
    <div className="app-shell">
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
      <SlideList
        slides={slides}
        activeSlideId={activeSlideId}
        onSelect={presentationStore.setActiveSlide}
      />
      <Canvas slide={activeSlide} />
      <ChatPanel />
    </div>
  );
}

export default App;
