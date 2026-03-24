"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TabSwitcher } from "@/components/shared/TabSwitcher";
import { MusicTab } from "@/components/dashboard/MusicTab";
import { MoviesTab } from "@/components/dashboard/MoviesTab";
import { getGreeting } from "@/lib/utils";

interface DashboardContentProps {
  userName: string | null;
}

export function DashboardContent({ userName }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<"music" | "movies">("music");
  // Compute greeting client-side only to avoid SSR/client timezone mismatch
  const [greeting, setGreeting] = useState<string>("");
  useEffect(() => {
    setGreeting(getGreeting(userName ?? undefined));
  }, [userName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen pt-28 px-4 sm:px-6 pb-12"
    >
      <div className="max-w-6xl mx-auto">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            What are you in the mood for?
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex justify-center mb-8"
        >
          <TabSwitcher defaultTab="music" onTabChange={setActiveTab} />
        </motion.div>

        {/* Tab content with cross-fade on switch */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeTab === "music" ? <MusicTab /> : <MoviesTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
