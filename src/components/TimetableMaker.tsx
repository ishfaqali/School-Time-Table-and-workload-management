import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  Plus,
  Trash2,
  AlertTriangle,
  Move,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { ClassPeriod, GradeClass, StaffMember, TimeSlotConfig, ClashResult } from '../types/index.ts';
import { DAYS_OF_WEEK } from '../data/mockData.ts';
import { detectClashes } from '../utils/timetableLogic.ts';
import { exportClassTimetablePDF } from '../utils/pdfExport.ts';

interface TimetableMakerProps {
  classes: GradeClass[];
  timeSlots: TimeSlotConfig[];
  periods: ClassPeriod[];
  staff: StaffMember[];
  onUpdatePeriods: (periods: ClassPeriod[]) => void;
  onClashDetected?: (clash: ClashResult) => void;
}

const AVAILABLE_SUBJECTS = [
  { name: 'Mathematics', defaultRoom: 'Room 101', color: 'bg-indigo-50 border-indigo-200 text-indigo-900', defaultTeacher: 't1' },
  { name: 'Physics', defaultRoom: 'Physics Lab', color: 'bg-cyan-50 border-cyan-200 text-cyan-900', defaultTeacher: 't2' },
  { name: 'Chemistry', defaultRoom: 'Lab B1', color: 'bg-teal-50 border-teal-200 text-teal-900', defaultTeacher: 't2' },
  { name: 'Biology', defaultRoom: 'Lab B2', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', defaultTeacher: 't6' },
  { name: 'English Lit', defaultRoom: 'Room 101', color: 'bg-amber-50 border-amber-200 text-amber-900', defaultTeacher: 't4' },
  { name: 'World History', defaultRoom: 'Room 201', color: 'bg-rose-50 border-rose-200 text-rose-900', defaultTeacher: 't5' },
  { name: 'Computer Science', defaultRoom: 'Comp Lab 1', color: 'bg-blue-50 border-blue-200 text-blue-900', defaultTeacher: 't3' },
  { name: 'Physical Ed', defaultRoom: 'Sports Field', color: 'bg-orange-50 border-orange-200 text-orange-900', defaultTeacher: 't7' },
  { name: 'Visual Arts', defaultRoom: 'Art Studio', color: 'bg-purple-50 border-purple-200 text-purple-900', defaultTeacher: 't8' },
];

export const TimetableMaker: React.FC<TimetableMakerProps> = ({
  classes,
  timeSlots,
  periods,
  staff,
  onUpdatePeriods,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'g9a');
  const [draggedSubject, setDraggedSubject] = useState<{ name: string; defaultRoom: string; defaultTeacher: string } | null>(null);
  const [draggedPeriodId, setDraggedPeriodId] = useState<string | null>(null);
  const [activeClash, setActiveClash] = useState<ClashResult | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<ClassPeriod | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [schoolName, setSchoolName] = useState('Oakridge International Academy');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [term, setTerm] = useState('Fall Term 1');
  const [viewFilter, setViewFilter] = useState<'class' | 'teacher'>('class');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(staff.find((s) => s.role === 'teacher')?.id || '');

  const teachers = staff.filter((s) => s.role === 'teacher');
  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Drag start from palette
  const handleDragStartPalette = (subject: { name: string; defaultRoom: string; defaultTeacher: string }) => {
    setDraggedSubject(subject);
    setDraggedPeriodId(null);
  };

  // Drag start from existing scheduled grid cell
  const handleDragStartCell = (periodId: string) => {
    setDraggedPeriodId(periodId);
    setDraggedSubject(null);
  };

  // Drop onto a slot
  const handleDropSlot = (day: typeof DAYS_OF_WEEK[number], slotIndex: number) => {
    const slot = timeSlots.find((s) => s.index === slotIndex);
    if (slot?.isBreak) return;

    if (draggedSubject) {
      const teacher = teachers.find((t) => t.id === draggedSubject.defaultTeacher) || teachers[0];
      const candidate = {
        gradeId: selectedClass.id,
        teacherId: teacher.id,
        teacherName: teacher.name,
        room: draggedSubject.defaultRoom,
        dayOfWeek: day,
        slotIndex,
      };

      const clashes = detectClashes(periods, candidate);
      if (clashes.length > 0) {
        setActiveClash(clashes[0]);
      }

      // Remove any existing period in that slot for this class
      const remaining = periods.filter(
        (p) => !(p.gradeId === selectedClass.id && p.dayOfWeek === day && p.slotIndex === slotIndex)
      );

      const newPeriod: ClassPeriod = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        gradeId: selectedClass.id,
        gradeName: selectedClass.name,
        dayOfWeek: day,
        slotIndex,
        subject: draggedSubject.name,
        teacherId: teacher.id,
        teacherName: teacher.name,
        room: draggedSubject.defaultRoom,
      };

      onUpdatePeriods([...remaining, newPeriod]);
      setDraggedSubject(null);
    } else if (draggedPeriodId) {
      const existing = periods.find((p) => p.id === draggedPeriodId);
      if (!existing) return;

      const candidate = {
        id: existing.id,
        gradeId: selectedClass.id,
        teacherId: existing.teacherId,
        teacherName: existing.teacherName,
        room: existing.room,
        dayOfWeek: day,
        slotIndex,
      };

      const clashes = detectClashes(periods, candidate);
      if (clashes.length > 0) {
        setActiveClash(clashes[0]);
      }

      // Check if target slot has another period to swap
      const targetPeriod = periods.find(
        (p) => p.gradeId === selectedClass.id && p.dayOfWeek === day && p.slotIndex === slotIndex && p.id !== draggedPeriodId
      );

      let updated = periods.filter((p) => p.id !== draggedPeriodId);

      if (targetPeriod) {
        // Swap slots
        updated = updated.map((p) => {
          if (p.id === targetPeriod.id) {
            return {
              ...p,
              dayOfWeek: existing.dayOfWeek,
              slotIndex: existing.slotIndex,
            };
          }
          return p;
        });
      }

      updated.push({
        ...existing,
        dayOfWeek: day,
        slotIndex,
      });

      onUpdatePeriods(updated);
      setDraggedPeriodId(null);
    }
  };

  const handleDeletePeriod = (id: string) => {
    onUpdatePeriods(periods.filter((p) => p.id !== id));
    if (editingPeriod?.id === id) {
      setEditingPeriod(null);
    }
  };

  const handleSaveEditedPeriod = (updated: ClassPeriod) => {
    const clashes = detectClashes(periods, updated);
    if (clashes.length > 0) {
      setActiveClash(clashes[0]);
    }
    onUpdatePeriods(periods.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPeriod(null);
  };

  const handleExportPDF = () => {
    exportClassTimetablePDF(selectedClass, timeSlots, periods, {
      schoolName,
      academicYear,
      term,
      title: `${selectedClass.name} Timetable`,
      subtitle: `Class Teacher: ${selectedClass.classTeacherName}`,
    });
    setShowExportModal(false);
  };

  const handleNativePrint = () => {
    window.print();
  };

  // Quick fill demo schedule
  const handleAutoOptimize = () => {
    // Fill empty slots with balanced subjects
    const newPeriods = [...periods];
    const currentClassPeriods = newPeriods.filter((p) => p.gradeId === selectedClass.id);

    DAYS_OF_WEEK.forEach((day) => {
      timeSlots.forEach((slot) => {
        if (slot.isBreak) return;
        const exists = currentClassPeriods.some((p) => p.dayOfWeek === day && p.slotIndex === slot.index);
        if (!exists) {
          const randomSub = AVAILABLE_SUBJECTS[(slot.index + day.length) % AVAILABLE_SUBJECTS.length];
          const teacher = teachers.find((t) => t.id === randomSub.defaultTeacher) || teachers[0];
          newPeriods.push({
            id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            gradeId: selectedClass.id,
            gradeName: selectedClass.name,
            dayOfWeek: day,
            slotIndex: slot.index,
            subject: randomSub.name,
            teacherId: teacher.id,
            teacherName: teacher.name,
            room: randomSub.defaultRoom,
          });
        }
      });
    });

    onUpdatePeriods(newPeriods);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Class / Grade:</span>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedClassId === cls.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoOptimize}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Automatically populate unfilled slots with standard curriculum subjects"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Auto-Fill Gaps</span>
            </button>
            <button
              onClick={handleNativePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Vector PDF</span>
            </button>
          </div>
        </div>

        {/* Selected Class Info strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900">{selectedClass.name}</span>
            <span>·</span>
            <span>Room: {selectedClass.roomNumber}</span>
            <span>·</span>
            <span>Class Teacher: {selectedClass.classTeacherName}</span>
            <span>·</span>
            <span>{selectedClass.studentCount} Students</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">View Mode:</span>
            <button
              onClick={() => setViewFilter('class')}
              className={`px-2 py-0.5 rounded text-xs ${
                viewFilter === 'class' ? 'bg-slate-200 font-semibold text-slate-900' : 'text-slate-600'
              }`}
            >
              Class Timetable
            </button>
            <button
              onClick={() => setViewFilter('teacher')}
              className={`px-2 py-0.5 rounded text-xs ${
                viewFilter === 'teacher' ? 'bg-slate-200 font-semibold text-slate-900' : 'text-slate-600'
              }`}
            >
              Teacher Schedule
            </button>
            {viewFilter === 'teacher' && (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Clash Alert Banner */}
      {activeClash && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Timetable Clash Warning ({activeClash.type === 'teacher' ? 'Faculty Double-Booking' : 'Room Conflict'})
              </h4>
              <p className="text-xs mt-0.5 text-amber-800">{activeClash.conflictDescription}</p>
              <p className="text-[11px] text-amber-700 mt-1">
                Day: <span className="font-semibold">{activeClash.dayOfWeek}</span> · Period Slot #{activeClash.slotIndex + 1}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveClash(null)}
            className="text-amber-700 hover:text-amber-900 text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Drag-and-Drop Palette (Quick Subject Picker) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Drag-and-Drop Curriculum Palette
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Drag any subject card into an empty period slot below, or drag existing slots to swap
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {AVAILABLE_SUBJECTS.map((sub) => {
            const defaultTeacherObj = teachers.find((t) => t.id === sub.defaultTeacher);
            return (
              <div
                key={sub.name}
                draggable
                onDragStart={() => handleDragStartPalette(sub)}
                className={`cursor-grab active:cursor-grabbing border rounded-lg p-2 transition-all hover:scale-102 hover:shadow-xs select-none ${sub.color}`}
              >
                <div className="font-bold text-xs truncate">{sub.name}</div>
                <div className="text-[10px] opacity-75 truncate">{defaultTeacherObj?.name.split(' ')[1] || 'Staff'}</div>
                <div className="text-[9px] opacity-60 truncate">{sub.defaultRoom}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Timetable Matrix Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden printable-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs">
                <th className="py-3 px-3 font-bold w-28 uppercase tracking-wider text-slate-800">
                  Day / Time
                </th>
                {timeSlots.map((slot) => (
                  <th key={slot.index} className="py-3 px-2 text-center font-semibold border-l border-slate-200">
                    <div className="text-xs font-bold text-slate-900">{slot.label}</div>
                    <div className="text-[11px] font-normal text-slate-500 tabular-nums">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <tr
                  key={day}
                  className={`border-b border-slate-200 transition-colors ${
                    dayIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  {/* Day header cell */}
                  <td className="py-3 px-3 font-semibold text-slate-900 text-xs border-r border-slate-200 bg-slate-50/80">
                    <div className="flex items-center gap-1.5">
                      <span>{day}</span>
                    </div>
                  </td>

                  {/* Slot Cells */}
                  {timeSlots.map((slot) => {
                    if (slot.isBreak) {
                      return (
                        <td
                          key={slot.index}
                          className="py-2 px-1 text-center bg-slate-100/70 border-l border-slate-200 text-slate-500 select-none"
                        >
                          <div className="text-[11px] font-medium italic text-slate-400">
                            {slot.breakTitle}
                          </div>
                        </td>
                      );
                    }

                    // Find period in this slot
                    const currentPeriod =
                      viewFilter === 'class'
                        ? periods.find(
                            (p) =>
                              p.gradeId === selectedClass.id &&
                              p.dayOfWeek === day &&
                              p.slotIndex === slot.index
                          )
                        : periods.find(
                            (p) =>
                              p.teacherId === selectedTeacherId &&
                              p.dayOfWeek === day &&
                              p.slotIndex === slot.index
                          );

                    return (
                      <td
                        key={slot.index}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropSlot(day, slot.index)}
                        className="py-2 px-1.5 border-l border-slate-200 relative group h-20 align-top hover:bg-indigo-50/20 transition-colors"
                      >
                        {currentPeriod ? (
                          <div
                            draggable
                            onDragStart={() => handleDragStartCell(currentPeriod.id)}
                            className="h-full rounded-lg p-2 border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group/cell cursor-grab active:cursor-grabbing"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {currentPeriod.subject}
                                </span>
                                <div className="opacity-0 group-hover/cell:opacity-100 flex items-center gap-0.5 print-hide">
                                  <button
                                    onClick={() => setEditingPeriod(currentPeriod)}
                                    className="p-0.5 text-slate-400 hover:text-indigo-600 rounded"
                                    title="Edit period details"
                                  >
                                    <Move className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePeriod(currentPeriod.id)}
                                    className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                                    title="Delete period"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                {viewFilter === 'class' ? currentPeriod.teacherName : currentPeriod.gradeName}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                              <span>{currentPeriod.room}</span>
                              <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded">
                                P{slot.index + 1}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full border border-dashed border-slate-200 hover:border-indigo-300 rounded-lg flex items-center justify-center p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                            <span className="text-[11px] font-medium">+ Drop</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Period Modal */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Period Details ({editingPeriod.dayOfWeek} · Slot #{editingPeriod.slotIndex + 1})
              </h3>
              <button
                onClick={() => setEditingPeriod(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={editingPeriod.subject}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned Teacher</label>
                <select
                  value={editingPeriod.teacherId}
                  onChange={(e) => {
                    const t = teachers.find((tc) => tc.id === e.target.value);
                    setEditingPeriod({
                      ...editingPeriod,
                      teacherId: e.target.value,
                      teacherName: t ? t.name : editingPeriod.teacherName,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Classroom / Laboratory</label>
                <input
                  type="text"
                  value={editingPeriod.room}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, room: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => handleDeletePeriod(editingPeriod.id)}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Slot</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingPeriod(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveEditedPeriod(editingPeriod)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Export Printable Vector PDF</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">School / Institution Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Term / Semester</label>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600">
                <div className="font-semibold text-slate-900 mb-1">PDF Specifications:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Landscape A4 format (297mm × 210mm)</li>
                  <li>Vector typography with period timing & room codes</li>
                  <li>Academic Coordinator & Principal official signature lines</li>
                  <li>Clash-free verified curriculum layout</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                <span>Generate & Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
