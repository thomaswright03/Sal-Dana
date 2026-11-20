"use client";

import { createContext, useContext } from "react";

/** True once the opening curtain has lifted, so sections can time their entrances to it. */
export const IntroContext = createContext(false);
export const useIntroDone = () => useContext(IntroContext);

export const EASE = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
