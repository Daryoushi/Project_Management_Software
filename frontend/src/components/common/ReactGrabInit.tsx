"use client";

import { useEffect } from "react";

export function ReactGrabInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-grab").catch((err) => {
        console.debug("react-grab dynamic import:", err);
      });
    }
  }, []);

  return null;
}
