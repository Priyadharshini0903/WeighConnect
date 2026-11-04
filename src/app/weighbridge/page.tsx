"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function WeighbridgePage() {
  const [activeTab, setActiveTab] = useState("wb1");

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#3B2D20] mb-5">
          A-Block Weighbridge
        </h1>

        <div className="flex gap-2 border-b border-[#E3D6C5] mb-5">
          <button
            onClick={() => setActiveTab("wb1")}
            className={`px-5 py-3 font-medium ${
              activeTab === "wb1"
                ? "border-b-2 border-[#6F5038] text-[#6F5038]"
                : "text-[#786B5E]"
            }`}>
            Weighbridge 1
          </button>

          <button
            onClick={() => setActiveTab("wb2")}
            className={`px-5 py-3 font-medium ${
              activeTab === "wb2"
                ? "border-b-2 border-[#6F5038] text-[#6F5038]"
                : "text-[#786B5E]"
            }`}>
            Weighbridge 2
          </button>
        </div>

        {activeTab === "wb1" && (
          <div className="rounded-lg border border-[#E3D6C5] bg-[#FFFCF8] p-5">
            <h2 className="font-semibold">Weighbridge 1</h2>
            <p className="text-sm text-[#786B5E] mt-2">
              Weighbridge 1 form will be added here.
            </p>
          </div>
        )}

        {activeTab === "wb2" && (
          <div className="rounded-lg border border-[#E3D6C5] bg-[#FFFCF8] p-5">
            <h2 className="font-semibold">Weighbridge 2</h2>
            <p className="text-sm text-[#786B5E] mt-2">
              Weighbridge 2 form will be added here.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}