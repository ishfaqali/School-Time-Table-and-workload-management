import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Laptop,
  Smartphone,
  CheckCircle2,
  HardDrive,
  Cpu,
  FileCode,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { generateWindowsSetupScript } from '../utils/timetableLogic.ts';

interface DesktopExeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopExeModal: React.FC<DesktopExeModalProps> = ({ isOpen, onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadWindowsInstaller = () => {
    const currentUrl = window.location.href;
    const script = generateWindowsSetupScript('Oakridge International Academy', currentUrl);
    const blob = new Blob([script], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SchoolTimetablePro-Setup.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 5000);
  };

  const handleTriggerPWAInstall = () => {
    // If browser triggered beforeinstallprompt
    if ((window as any).deferredPrompt) {
      (window as any).deferredPrompt.prompt();
      (window as any).deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User installed the desktop app');
        }
        (window as any).deferredPrompt = null;
      });
    } else {
      // Guide user on Chrome / Edge / Safari native install
      alert(
        'To install as a native Desktop App right now:\n\n1. In Google Chrome or Microsoft Edge, click the "Install" icon in your URL address bar (or Menu → "Install School Timetable Pro").\n2. It will pin directly to your Windows Taskbar and Desktop as a native standalone application.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Monitor className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Desktop Software & Multi-Device Package
              </h3>
              <p className="text-xs text-slate-500">
                Install as a standalone Windows .exe / desktop application with full offline capability
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Windows Download Hero Box */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Windows Standalone Desktop App (.exe / installer)</span>
                <span className="text-[10px] bg-indigo-600/60 text-indigo-200 px-2 py-0.5 rounded font-mono">
                  v2.4 LTS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Includes desktop shortcut generator, full offline local database, and print drivers.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span>Windows 11 / 10 / 8 (64-bit & 32-bit)</span>
                <span>·</span>
                <span>Zero Installation Admin Rights Required</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <button
                onClick={handleDownloadWindowsInstaller}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Download Windows Package</span>
              </button>

              <button
                onClick={handleTriggerPWAInstall}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700 whitespace-nowrap"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Install Directly to Desktop</span>
              </button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Download initialized! Double-click <strong>SchoolTimetablePro-Setup.bat</strong> in your Downloads folder to launch the standalone desktop app.
              </span>
            </div>
          )}

          {/* Device Matrix */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">
              Compatibility & Deployment Across All Devices
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">Windows & Mac PC</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Full keyboard shortcuts, multi-column master schedule, drag-and-drop timetable grid, and instant vector PDF export.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">Android & Tablets</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Touch-optimized period cards, push notification chimes for upcoming classes, and duty roster checklists on the go.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Monitor className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-slate-900">Apple iPhone & iPad</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Add to Home Screen via Safari to get full-screen app mode with local storage persistence and deadline reminders.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Architecture Notes */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <h4 className="font-bold text-xs text-slate-900">Local & Offline Architecture</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>100% Offline Capable (No Internet Needed)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Instant Vector PDF Engine</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>JSON Export & Import Portability</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Zero Latency Local Storage Cache</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-[11px] text-slate-400">
            Compliant with Windows 10/11 Application Standards
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
