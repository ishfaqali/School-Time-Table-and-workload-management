import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { TimetableMaker } from './components/TimetableMaker.tsx';
import { TeacherWorkload } from './components/TeacherWorkload.tsx';
import { StaffDutyManager } from './components/StaffDutyManager.tsx';
import { DeadlinesAndAlerts } from './components/DeadlinesAndAlerts.tsx';
import { DesktopExeModal } from './components/DesktopExeModal.tsx';
import { CloudSyncModal } from './components/CloudSyncModal.tsx';

import type {
  GradeClass,
  StaffMember,
  TimeSlotConfig,
  ClassPeriod,
  SupportDuty,
  AssignmentDeadline,
  NotificationItem,
} from './types/index.ts';

import {
  TIME_SLOTS,
  INITIAL_CLASSES,
  INITIAL_STAFF,
  INITIAL_DUTIES,
  INITIAL_DEADLINES,
  generateSeedPeriods,
} from './data/mockData.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'timetable' | 'workload' | 'duties' | 'alerts' | 'desktop'>('timetable');

  // Core School Data States with LocalStorage Persistence
  const [classes, setClasses] = useState<GradeClass[]>(() => {
    const saved = localStorage.getItem('school_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [timeSlots] = useState<TimeSlotConfig[]>(TIME_SLOTS);

  const [periods, setPeriods] = useState<ClassPeriod[]>(() => {
    const saved = localStorage.getItem('school_periods');
    return saved ? JSON.parse(saved) : generateSeedPeriods();
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('school_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [duties, setDuties] = useState<SupportDuty[]>(() => {
    const saved = localStorage.getItem('school_duties');
    return saved ? JSON.parse(saved) : INITIAL_DUTIES;
  });

  const [deadlines, setDeadlines] = useState<AssignmentDeadline[]>(() => {
    const saved = localStorage.getItem('school_deadlines');
    return saved ? JSON.parse(saved) : INITIAL_DEADLINES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Upcoming Period 1 Reminder',
      message: 'Grade 9-A Mathematics with Dr. John Adams starts at 08:30 AM in Room 101.',
      type: 'class_upcoming',
      timestamp: 'Just now',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Assignment Due Notice',
      message: 'Stoichiometry Lab Report for Grade 10-A is due in 48 hours.',
      type: 'deadline_due',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Campus Arrival Gate Duty',
      message: 'Robert Henderson assigned to North Main Entrance for 07:30 - 08:30 AM.',
      type: 'duty_alert',
      timestamp: '2 hours ago',
      read: true,
    },
  ]);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastSynced, setLastSynced] = useState<string>('Today at 09:42 AM');

  // Modal controls
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [dutyPreselectedStaffId, setDutyPreselectedStaffId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('school_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('school_periods', JSON.stringify(periods));
  }, [periods]);

  useEffect(() => {
    localStorage.setItem('school_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('school_duties', JSON.stringify(duties));
  }, [duties]);

  useEffect(() => {
    localStorage.setItem('school_deadlines', JSON.stringify(deadlines));
  }, [deadlines]);

  // Handle duty assignment jump from teacher workload view
  const handleOpenAssignDuty = (staffId?: string) => {
    if (staffId) {
      setDutyPreselectedStaffId(staffId);
    }
    setActiveTab('duties');
  };

  const handleUpdatePeriods = (newPeriods: ClassPeriod[]) => {
    setPeriods(newPeriods);
  };

  const handleAddDuty = (newDuty: SupportDuty) => {
    setDuties((prev) => [newDuty, ...prev]);
    // Add notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Auxiliary Duty Assigned',
      message: `${newDuty.staffName} assigned to ${newDuty.category} at ${newDuty.location}.`,
      type: 'duty_alert',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleUpdateDutyStatus = (
    dutyId: string,
    status: 'scheduled' | 'completed' | 'substituted'
  ) => {
    setDuties((prev) => prev.map((d) => (d.id === dutyId ? { ...d, status } : d)));
  };

  const handleDeleteDuty = (dutyId: string) => {
    setDuties((prev) => prev.filter((d) => d.id !== dutyId));
  };

  const handleAddDeadline = (newDeadline: AssignmentDeadline) => {
    setDeadlines((prev) => [newDeadline, ...prev]);
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Assignment Deadline Scheduled',
      message: `${newDeadline.title} due on ${newDeadline.dueDate} (${newDeadline.gradeName}).`,
      type: 'deadline_due',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleToggleDeadline = (deadlineId: string) => {
    setDeadlines((prev) =>
      prev.map((d) => (d.id === deadlineId ? { ...d, completed: !d.completed } : d))
    );
  };

  const handleDeleteDeadline = (deadlineId: string) => {
    setDeadlines((prev) => prev.filter((d) => d.id !== deadlineId));
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleTriggerTestNotification = () => {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Class Countdown Alert',
      message: 'Next session: Grade 10-A Chemistry begins in 10 minutes in Laboratory B1.',
      type: 'class_upcoming',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleTriggerSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSynced(`Today at ${timeStr}`);
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Cloud Synchronization Complete',
        message: 'All schedule changes, staff duties, and workload updates successfully synced across devices.',
        type: 'sync_success',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }, 1200);
  };

  const handleImportBackup = (data: {
    classes: GradeClass[];
    periods: ClassPeriod[];
    staff: StaffMember[];
    duties: SupportDuty[];
    deadlines: AssignmentDeadline[];
  }) => {
    setClasses(data.classes);
    setPeriods(data.periods);
    setStaff(data.staff);
    setDuties(data.duties);
    setDeadlines(data.deadlines);
  };

  const unreadAlertsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'desktop') {
            setShowDesktopModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        unreadAlertsCount={unreadAlertsCount}
        onOpenSync={() => setShowSyncModal(true)}
        onOpenDesktop={() => setShowDesktopModal(true)}
        syncStatus={syncStatus}
        lastSynced={lastSynced}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'timetable' && (
          <TimetableMaker
            classes={classes}
            timeSlots={timeSlots}
            periods={periods}
            staff={staff}
            onUpdatePeriods={handleUpdatePeriods}
          />
        )}

        {activeTab === 'workload' && (
          <TeacherWorkload
            staff={staff}
            periods={periods}
            duties={duties}
            timeSlots={timeSlots}
            onOpenAssignDuty={handleOpenAssignDuty}
          />
        )}

        {activeTab === 'duties' && (
          <StaffDutyManager
            staff={staff}
            duties={duties}
            onAddDuty={handleAddDuty}
            onUpdateDutyStatus={handleUpdateDutyStatus}
            onDeleteDuty={handleDeleteDuty}
            preselectedStaffId={dutyPreselectedStaffId}
            onClearPreselectedStaff={() => setDutyPreselectedStaffId(null)}
          />
        )}

        {activeTab === 'alerts' && (
          <DeadlinesAndAlerts
            deadlines={deadlines}
            periods={periods}
            classes={classes}
            staff={staff}
            notifications={notifications}
            onAddDeadline={handleAddDeadline}
            onToggleDeadline={handleToggleDeadline}
            onDeleteDeadline={handleDeleteDeadline}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearAllNotifications={handleClearAllNotifications}
            onTriggerTestNotification={handleTriggerTestNotification}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Oakridge International Academy</span>
            <span>·</span>
            <span>Academic Year 2026-2027</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Offline Ready PWA</span>
            <span>·</span>
            <span>Windows Desktop (.exe) Enabled</span>
            <span>·</span>
            <span>Print & PDF Certified</span>
          </div>
        </div>
      </footer>

      {/* Standalone Desktop .exe Downloader Modal */}
      <DesktopExeModal
        isOpen={showDesktopModal}
        onClose={() => setShowDesktopModal(false)}
      />

      {/* Cloud Sync & Backup Modal */}
      <CloudSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        classes={classes}
        periods={periods}
        staff={staff}
        duties={duties}
        deadlines={deadlines}
        onImportBackup={handleImportBackup}
        lastSynced={lastSynced}
        onTriggerSync={handleTriggerSync}
        syncStatus={syncStatus}
      />
    </div>
  );
}
