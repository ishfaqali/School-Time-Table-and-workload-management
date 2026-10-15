import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  PlusCircle,
  Trash2,
  Check,
  Send,
  Sparkles,
  Smartphone,
  X,
} from 'lucide-react';
import type {
  AssignmentDeadline,
  ClassPeriod,
  GradeClass,
  NotificationItem,
  StaffMember,
} from '../types/index.ts';

interface DeadlinesAndAlertsProps {
  deadlines: AssignmentDeadline[];
  periods: ClassPeriod[];
  classes: GradeClass[];
  staff: StaffMember[];
  notifications: NotificationItem[];
  onAddDeadline: (deadline: AssignmentDeadline) => void;
  onToggleDeadline: (deadlineId: string) => void;
  onDeleteDeadline: (deadlineId: string) => void;
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onTriggerTestNotification: () => void;
}

export const DeadlinesAndAlerts: React.FC<DeadlinesAndAlertsProps> = ({
  deadlines,
  periods,
  classes,
  staff,
  notifications,
  onAddDeadline,
  onToggleDeadline,
  onDeleteDeadline,
  onMarkNotificationRead,
  onClearAllNotifications,
  onTriggerTestNotification,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Form State
  const [title, setTitle] = useState('');
  const [gradeId, setGradeId] = useState(classes[0]?.id || 'g9a');
  const [subject, setSubject] = useState('Mathematics');
  const [dueDate, setDueDate] = useState('2026-10-18');
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === 'granted') {
          new Notification('School Timetable Pro Alerts Enabled', {
            body: 'You will receive immediate alerts for upcoming class schedules and homework deadlines.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.error('Notification permission error', err);
      }
    }
  };

  const playSynthesizedChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // AudioContext fallback
    }
  };

  const handleTestChime = () => {
    playSynthesizedChime();
    onTriggerTestNotification();
  };

  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    const cls = classes.find((c) => c.id === gradeId);
    const teacher = staff.find((s) => s.role === 'teacher');

    const newDeadline: AssignmentDeadline = {
      id: `dl-${Date.now()}`,
      title: title.trim(),
      gradeId,
      gradeName: cls ? cls.name : 'All Classes',
      subject,
      dueDate,
      dueTime,
      description: description.trim() || 'Submission required on student portal.',
      assignedTeacherId: teacher ? teacher.id : 't1',
      assignedTeacherName: teacher ? teacher.name : 'Faculty Lead',
      priority,
      completed: false,
    };

    onAddDeadline(newDeadline);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
  };

  // Next Upcoming Period calculation (mocking live simulation)
  const currentDayName = 'Monday';
  const upcomingPeriods = periods
    .filter((p) => p.dayOfWeek === currentDayName)
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .slice(0, 3);

  const pendingDeadlines = deadlines.filter((d) => !d.completed);
  const completedDeadlines = deadlines.filter((d) => d.completed);

  return (
    <div className="space-y-6">
      {/* Alert Engine & Permission Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-tight">
              Real-Time Push & Audio Alerts (All Devices)
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Built-in notifications alert students and staff before class periods start and notify
            prior to assignment submission cut-offs on Windows Desktop, Android, iOS, and tablets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-indigo-600/80 text-white hover:bg-indigo-600'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>

          {browserPermission !== 'granted' ? (
            <button
              onClick={requestNotificationPermission}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
            >
              Enable Push Alerts
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-medium px-2 py-1 bg-emerald-950/50 border border-emerald-800 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Push Active</span>
            </span>
          )}

          <button
            onClick={handleTestChime}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            Test Alert
          </button>
        </div>
      </div>

      {/* Grid: Upcoming Classes Ticker + Assignment Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Class Schedule Ticker */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Upcoming Classes (Next 45 Mins)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                Live Roster
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {upcomingPeriods.map((p, idx) => (
                <div key={p.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{p.subject}</span>
                      <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 rounded">
                        {p.gradeName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Instructor: <span className="font-medium text-slate-700">{p.teacherName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Location: {p.room}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {idx === 0 ? 'Starts in 12m' : `Slot #${p.slotIndex + 1}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In-App Notifications History */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Notification Center ({notifications.length})
                </h3>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={onClearAllNotifications}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-2.5 px-2 rounded-lg transition-colors flex items-start justify-between gap-2 text-xs ${
                      !n.read ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                        )}
                        <span className="font-bold text-slate-900">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block tabular-nums">
                        {n.timestamp}
                      </span>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => onMarkNotificationRead(n.id)}
                        className="text-[10px] text-indigo-600 hover:underline shrink-0"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active notification alerts.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Assignment Deadlines Tracker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Assignment Deadlines & Submission Milestones
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track upcoming homework, laboratory reports, and examination due dates with alarms
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Assignment Deadline</span>
              </button>
            </div>

            {/* Pending Deadlines List */}
            <div className="mt-4 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pending Deadlines ({pendingDeadlines.length})
              </h4>

              {pendingDeadlines.length > 0 ? (
                pendingDeadlines.map((dl) => {
                  let badge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (dl.priority === 'high') {
                    badge = 'bg-rose-50 text-rose-700 border-rose-200';
                  } else if (dl.priority === 'medium') {
                    badge = 'bg-amber-50 text-amber-700 border-amber-200';
                  }

                  return (
                    <div
                      key={dl.id}
                      className="border border-slate-200 rounded-xl p-3.5 hover:border-indigo-300 hover:shadow-xs transition-all flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => onToggleDeadline(dl.id)}
                          className="mt-0.5 w-5 h-5 rounded border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors text-transparent hover:text-emerald-600"
                          title="Mark assignment as completed"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{dl.title}</span>
                            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                              {dl.gradeName} · {dl.subject}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badge}`}>
                              {dl.priority} Priority
                            </span>
                          </div>

                          <p className="text-slate-600 text-xs mt-1">{dl.description}</p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Due {dl.dueDate} at {dl.dueTime}</span>
                            </span>
                            <span>·</span>
                            <span>Faculty: {dl.assignedTeacherName}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteDeadline(dl.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Delete deadline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  No pending assignment deadlines. All submissions are up to date!
                </div>
              )}

              {/* Completed Section */}
              {completedDeadlines.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recently Completed ({completedDeadlines.length})
                  </h4>
                  <div className="space-y-2">
                    {completedDeadlines.map((dl) => (
                      <div
                        key={dl.id}
                        className="bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex items-center justify-between text-xs opacity-75"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleDeadline(dl.id)}
                            className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center"
                            title="Re-open deadline"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <span className="line-through text-slate-500">{dl.title}</span>
                          <span className="text-[10px] text-slate-400">({dl.gradeName})</span>
                        </div>
                        <button
                          onClick={() => onDeleteDeadline(dl.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Add New Assignment Deadline</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Chemistry Molecular Models Project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Class / Grade</label>
                  <select
                    value={gradeId}
                    onChange={(e) => setGradeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cutoff Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Instructions / Rubric</label>
                <textarea
                  rows={2}
                  placeholder="Detail instructions, accepted file formats, grading rubric..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save & Activate Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
