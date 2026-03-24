"use client";

import { useState } from "react";
import { Music, Film } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabSwitcherProps {
  defaultTab?: "music" | "movies";
  onTabChange?: (tab: "music" | "movies") => void;
}

const tabs = [
  { id: "music" as const, label: "Music", icon: Music, color: "var(--music-accent)" },
  { id: "movies" as const, label: "Movies", icon: Film, color: "var(--movie-accent)" },
];

export function TabSwitcher({ defaultTab = "music", onTabChange }: TabSwitcherProps) {
  const [activeTab, setActiveTab] = useState<"music" | "movies">(defaultTab);

  const handleTabChange = (tab: "music" | "movies") => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="relative inline-flex items-center gap-1 p-1 rounded-full bg-surface border border-white/5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors z-10",
              isActive ? "text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: tab.color }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <tab.icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
