/**
 * src/components/dashboard/DashboardShell.tsx
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UploadResponse } from "@/types/dataset";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// Views
import OverviewView from "../views/OverviewView";
import ProfileView from "../views/ProfileView";
import QualityView from "../views/QualityView";
import RelationshipsView from "../views/RelationshipsView";
import InsightsView from "../views/InsightsView";
import MLReadinessView from "../views/MLReadinessView";
import ReportsView from "../views/ReportsView";

interface DashboardShellProps {
  data: UploadResponse;
  file: File;
  onReset: () => void;
}

export default function DashboardShell({ data, file, onReset }: DashboardShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeView = searchParams.get("view") || "overview";

  // Prevent back-button from keeping invalid states (though stateless backend means refresh loses data anyway)
  const setView = (view: string) => {
    router.push(`/?view=${view}`);
  };

  const qualityCount = data.quality.warnings.filter(w => w.severity === "Critical" || w.severity === "Warning").length;

  const renderView = () => {
    switch (activeView) {
      case "overview": return <OverviewView data={data} onChangeView={setView} qualityCount={qualityCount} />;
      case "profile": return <ProfileView data={data} />;
      case "quality": return <QualityView data={data} />;
      case "relationships": return <RelationshipsView data={data} />;
      case "insights": return <InsightsView data={data} onChangeView={setView} />;
      case "ml-readiness": return <MLReadinessView data={data} file={file} />;
      case "reports": return <ReportsView data={data} />;
      default: return <OverviewView data={data} onChangeView={setView} qualityCount={qualityCount} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800">
      
      <Sidebar 
        activeView={activeView} 
        onChangeView={setView} 
        qualityWarningCount={qualityCount}
        isOpen={isMobileOpen}
        setIsOpen={setIsMobileOpen}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar 
          data={data} 
          filename={file.name} 
          onReset={onReset} 
          onMenuToggle={() => setIsMobileOpen(true)} 
          onChangeView={setView}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

    </div>
  );
}

