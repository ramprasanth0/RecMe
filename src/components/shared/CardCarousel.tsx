"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardCarouselProps {
  title?: string;
  titleExtra?: React.ReactNode;
  accentColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function CardCarousel({ title, titleExtra, accentColor, children, className }: CardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h3 className="text-sm font-semibold flex items-center gap-1.5" style={accentColor ? { color: accentColor } : undefined}>
          {title}
          {titleExtra}
        </h3>
      )}
      <div className="group relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10",
            "w-8 h-8 rounded-full bg-background border border-border shadow-md",
            "flex items-center justify-center transition-all duration-200",
            "opacity-0 group-hover:opacity-100 hover:bg-surface-light",
            !canScrollLeft && "pointer-events-none !opacity-0"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-1"
        >
          {children}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10",
            "w-8 h-8 rounded-full bg-background border border-border shadow-md",
            "flex items-center justify-center transition-all duration-200",
            "opacity-0 group-hover:opacity-100 hover:bg-surface-light",
            !canScrollRight && "pointer-events-none !opacity-0"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
