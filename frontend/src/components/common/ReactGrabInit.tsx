"use client";

import { useEffect } from "react";

export function ReactGrabInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      import("react-grab").catch((err) => {
        console.debug("react-grab dynamic import:", err);
      });
    }
  }, []);

  return null;
}
