"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShaderCanvasLazy = dynamic(() => import("./ShaderCanvas").then((m) => m.ShaderCanvas), { ssr: false });
const CursorLazy = dynamic(() => import("./Cursor").then((m) => m.Cursor), { ssr: false });
const ChatLazy = dynamic(() => import("./Chat").then((m) => m.Chat), { ssr: false });

/** True once the page has painted and the browser is idle, so heavy extras never delay first paint. */
function useIdle(): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const start = () => setIdle(true);
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(start, 2500);
    return () => window.clearTimeout(id);
  }, []);
  return idle;
}

function usePlainDevice(): boolean {
  const [plain, setPlain] = useState(true);
  useEffect(() => {
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlain(coarse || reduce);
  }, []);
  return plain;
}

/** The animated hero background: skipped on touch screens and for reduced motion, loaded after first paint. */
export function DeferredShader({ className = "" }: { className?: string }) {
  const idle = useIdle();
  const plain = usePlainDevice();
  return idle && !plain ? <ShaderCanvasLazy className={className} /> : null;
}

/** The custom cursor only matters with a mouse, so it loads after first paint and never on touch. */
export function DeferredCursor() {
  const idle = useIdle();
  const plain = usePlainDevice();
  return idle && !plain ? <CursorLazy /> : null;
}

/** The chat widget's code is fetched after first paint instead of with the page. */
export function DeferredChat() {
  return useIdle() ? <ChatLazy /> : null;
}
