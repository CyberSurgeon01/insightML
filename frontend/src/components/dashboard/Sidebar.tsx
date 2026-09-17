/**
 * src/components/dashboard/Sidebar.tsx
 */
"use client";

import { 
  LayoutDashboard, 
  Database, 
  ShieldAlert, 
  Link2, 
  Lightbulb, 
  Target, 
  FileDown,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  onChangeView: (view: string) => void;
  qualityWarningCount: number;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

export default function Sidebar({ activeView, onChangeView, qualityWarningCount, isOpen, setIsOpen }: SidebarProps) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Dataset Profile", icon: Database },
    { id: "quality", label: "Data Quality", icon: ShieldAlert, badge: qualityWarningCount },
    { id: "relationships", label: "Relationships", icon: Link2 },
    { id: "insights", label: "Smart Insights", icon: Lightbulb },
    { id: "ml-readiness", label: "ML Readiness", icon: Target },
    { id: "reports", label: "Reports & Exports", icon: FileDown },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-navy/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 shadow-sm flex flex-col
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 lg:hidden">
          <div className="font-bold text-[18px] text-navy tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[12px] font-black">
              I
            </div>
            InsightML
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden lg:flex h-16 items-center px-6 border-b border-slate-200 shrink-0">
          <div className="font-bold text-[18px] text-navy tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[12px] font-black">
              I
            </div>
            InsightML
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="text-[11px] text-slate-400 font-medium px-2">
            InsightML workspace
          </div>
        </div>
      </aside>
    </>
  );
}
