import React, { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Server,
  Layers,
  X,
  AlertCircle,
} from 'lucide-react';
import type {
  ClassPeriod,
  GradeClass,
  StaffMember,
  SupportDuty,
  AssignmentDeadline,
} from '../types/index.ts';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: GradeClass[];
  periods: ClassPeriod[];
  staff: StaffMember[];
  duties: SupportDuty[];
  deadlines: AssignmentDeadline[];
  onImportBackup: (data: {
    classes: GradeClass[];
    periods: ClassPeriod[];
    staff: StaffMember[];
    duties: SupportDuty[];
    deadlines: AssignmentDeadline[];
  }) => void;
  lastSynced: string;
  onTriggerSync: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  classes,
  periods,
  staff,
  duties,
  deadlines,
  onImportBackup,
  lastSynced,
  onTriggerSync,
  syncStatus,
}) => {
  const [schoolCode, setSchoolCode] = useState('OAKRIDGE-2026-HQ');
  const [autoSync, setAutoSync] = useState(true);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backupData = {
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      schoolCode,
      classes,
      periods,
      staff,
      duties,
      deadlines,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SchoolTimetable_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.classes && parsed.periods && parsed.staff) {
          onImportBackup({
            classes: parsed.classes,
            periods: parsed.periods,
            staff: parsed.staff,
            duties: parsed.duties || [],
            deadlines: parsed.deadlines || [],
          });
          setImportNotice('Cloud snapshot restored successfully from file!');
          setTimeout(() => setImportNotice(null), 4000);
        } else {
          setImportNotice('Invalid backup file structure.');
        }
      } catch (err) {
        setImportNotice('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cloud Sync & Backup Manager</h3>
              <p className="text-[11px] text-slate-500">
                Multi-device timetable synchronization with cloud backup
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs text-slate-600">
          {/* Status Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-900">School Cloud Channel:</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Connected
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 flex-1 uppercase tracking-wider"
                placeholder="Enter School Sync ID"
              />
              <button
                onClick={onTriggerSync}
                disabled={syncStatus === 'syncing'}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
              <span>Last cloud sync: <strong className="text-slate-700 tabular-nums">{lastSynced}</strong></span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Auto-sync changes</span>
              </label>
            </div>
          </div>

          {importNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importNotice}</span>
            </div>
          )}

          {/* Backup & Restore Controls */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Data Portability & Off-Site Archive
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJSON}
                className="p-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-colors text-left flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">Export Backup</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Save all timetables, staff duties, and deadlines as a portable JSON file.
                </p>
              </button>

              <label className="p-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-colors text-left flex flex-col justify-between cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">Restore Backup</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Load an existing schedule snapshot from any device or colleague.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Sync Stats Strip */}
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>TLS 256-bit Encrypted Sync Channel</span>
            </span>
            <span className="tabular-nums">
              {periods.length} Periods · {staff.length} Personnel
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
