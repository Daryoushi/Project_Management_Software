import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Enterprise Collaboration Brand Logo
 * High-definition bespoke SaaS visual identity.
 */
export function BrandLogo({ className = "h-8 w-8", size = 32 }: LogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-xl shadow-md border border-border/30 bg-[#141820] ${className}`}
    >
      <Image
        src="/brand-logo.png"
        alt="SaaS Brand Logo"
        width={size}
        height={size}
        className="w-full h-full object-cover select-none"
        priority
      />
    </div>
  );
}
