import React from 'react';
import { Calendar, UserCheck, ShieldAlert, Bell, Download, Cloud, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'timetable' | 'workload' | 'duties' | 'alerts' | 'desktop';
  setActiveTab: (tab: 'timetable' | 'workload' | 'duties' | 'alerts' | 'desktop') => void;
  unreadAlertsCount: number;
  onOpenSync: () => void;
  onOpenDesktop: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  lastSynced: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadAlertsCount,
  onOpenSync,
  onOpenDesktop,
  syncStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setActiveTab('timetable')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2.5 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <span>School Timetable Pro</span>
          </button>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'timetable'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Timetable Maker
            </button>
            <button
              onClick={() => setActiveTab('workload')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'workload'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Teacher Workload</span>
            </button>
            <button
              onClick={() => setActiveTab('duties')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'duties'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Staff Duties</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Deadlines & Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="text-[11px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('desktop')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'desktop'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Desktop App (.exe)</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenSync}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Cloud Sync Manager"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Cloud Sync</span>
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
              ) : (
                <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
              )}
            </button>
            <button
              onClick={onOpenDesktop}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get .exe App</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-3 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'timetable' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'
          }`}
        >
          Timetable
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={`px-3 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'workload' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'
          }`}
        >
          Workload
        </button>
        <button
          onClick={() => setActiveTab('duties')}
          className={`px-3 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'duties' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'
          }`}
        >
          Staff Duties
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'alerts' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'
          }`}
        >
          Alerts {unreadAlertsCount > 0 ? `(${unreadAlertsCount})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('desktop')}
          className={`px-3 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'desktop' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'
          }`}
        >
          .exe App
        </button>
      </div>
    </header>
  );
};
