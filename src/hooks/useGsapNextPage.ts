"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useGsapNextPage(
  scopeRef: RefObject<HTMLElement | null>,
  headerCtaRef: RefObject<HTMLElement | null>,
) {
  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(scope.querySelectorAll(".next-reveal, .next-hero-in"), {
          opacity: 1,
          y: 0,
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(scope.querySelectorAll(".next-hero-in"), {
          y: 28,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.08,
        });

        gsap.utils.toArray<HTMLElement>(scope.querySelectorAll(".next-reveal")).forEach((el) => {
          gsap.from(el, {
            y: 36,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          });
        });
      });

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const cta = headerCtaRef.current;
        if (!cta) return;

        gsap.to(cta, {
          scale: 1.02,
          duration: 1.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(cta, {
          boxShadow: "0 0 0 2px oklch(0.62 0.22 145 / 0.1)",
          duration: 1.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      return () => mm.revert();
    },
    { scope: scopeRef },
  );
}
