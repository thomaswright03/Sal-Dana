"use client";

import Lenis from "lenis";
import { useEffect, useState, type ReactNode } from "react";
import { Cursor } from "./Cursor";
import { IntroContext } from "./Intro";
import { Preloader } from "./Preloader";

/** Client-side frame for the marketing site: intro curtain, smooth scrolling, custom cursor. */
export function SiteShell({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, anchors: { offset: -72 } });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return (
    <IntroContext.Provider value={introDone}>
      <Preloader onDone={() => setIntroDone(true)} />
      <Cursor />
      <div className="grain has-cursor relative">{children}</div>
    </IntroContext.Provider>
  );
}
