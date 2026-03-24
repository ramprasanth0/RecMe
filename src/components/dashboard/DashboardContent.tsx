"use client";

import { useState } from "react";
import { TabSwitcher } from "@/components/shared/TabSwitcher";
import { MusicTab } from "@/components/dashboard/MusicTab";
import { MoviesTab } from "@/components/dashboard/MoviesTab";
import { getGreeting } from "@/lib/utils";

interface DashboardContentProps {
  userName: string | null;
}

export function DashboardContent({ userName }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<"music" | "movies">("music");

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {getGreeting(userName ?? undefined)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            What are you in the mood for?
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <TabSwitcher defaultTab="music" onTabChange={setActiveTab} />
        </div>

        {/* Tab content */}
        {activeTab === "music" ? <MusicTab /> : <MoviesTab />}
      </div>
    </div>
  );
}
