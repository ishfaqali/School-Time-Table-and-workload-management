import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  Filter,
  Eye,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import type { StaffMember, ClassPeriod, SupportDuty, TimeSlotConfig } from '../types/index.ts';
import { calculateTeacherWorkloads } from '../utils/timetableLogic.ts';
import { DAYS_OF_WEEK } from '../data/mockData.ts';

interface TeacherWorkloadProps {
  staff: StaffMember[];
  periods: ClassPeriod[];
  duties: SupportDuty[];
  timeSlots: TimeSlotConfig[];
  onOpenAssignDuty: (staffId?: string) => void;
}

export const TeacherWorkload: React.FC<TeacherWorkloadProps> = ({
  staff,
  periods,
  duties,
  timeSlots,
  onOpenAssignDuty,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [inspectedTeacherId, setInspectedTeacherId] = useState<string | null>(null);

  const teacherList = staff.filter((s) => s.role === 'teacher');
  const workloads = calculateTeacherWorkloads(teacherList, periods, duties);

  // Departments list
  const departments = Array.from(new Set(teacherList.map((t) => t.department)));

  // Aggregate metrics
  const totalFaculty = teacherList.length;
  const totalAssignedPeriods = workloads.reduce((sum, w) => sum + w.assignedPeriodsCount, 0);
  const avgPeriods = totalFaculty > 0 ? (totalAssignedPeriods / totalFaculty).toFixed(1) : '0';
  const overloadedTeachers = workloads.filter((w) => w.status === 'overloaded');
  const heavyTeachers = workloads.filter((w) => w.status === 'heavy');
  const totalTeacherDuties = workloads.reduce((sum, w) => sum + w.assignedDutiesCount, 0);

  // Filtered rows
  const filteredWorkloads = workloads.filter((w) => {
    const teacher = teacherList.find((t) => t.id === w.teacherId);
    if (!teacher) return false;

    const matchesSearch =
      w.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.subjectsTaught.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === 'all' || w.department === selectedDept;
    const matchesStatus = selectedStatus === 'all' || w.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const inspectedTeacher = teacherList.find((t) => t.id === inspectedTeacherId);
  const inspectedWorkload = workloads.find((w) => w.teacherId === inspectedTeacherId);

  return (
    <div className="space-y-6">
      {/* Admin Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Teaching Faculty
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalFaculty}</span>
            <span className="text-xs text-slate-500">certified instructors</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {departments.length} Academic Departments
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Weekly Load
            </span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{avgPeriods}</span>
            <span className="text-xs text-slate-500">periods / teacher</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Standard target cap: 22 - 24 periods
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overload Alerts
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${overloadedTeachers.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tabular-nums ${
                overloadedTeachers.length > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {overloadedTeachers.length}
            </span>
            <span className="text-xs text-slate-500">exceeding max limit</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {heavyTeachers.length} teachers approaching threshold
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Auxiliary Duties
            </span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalTeacherDuties}</span>
            <span className="text-xs text-slate-500">active assignments</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Across gate, recess & exam monitoring
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty name, department, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="overloaded">Overloaded (&gt;100%)</option>
              <option value="heavy">Heavy Load (90-100%)</option>
              <option value="optimal">Optimal Load (65-90%)</option>
              <option value="underloaded">Underloaded (&lt;65%)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => onOpenAssignDuty()}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Assign Additional Duty</span>
        </button>
      </div>

      {/* Faculty Workload Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Teacher & Dept</th>
                <th className="py-3 px-3 font-semibold">Subjects Taught</th>
                <th className="py-3 px-3 font-semibold text-center">Periods / Cap</th>
                <th className="py-3 px-4 font-semibold">Workload Utilization</th>
                <th className="py-3 px-3 font-semibold text-center">Duties</th>
                <th className="py-3 px-3 font-semibold text-center">Daily Breakdown</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredWorkloads.map((w) => {
                const teacher = teacherList.find((t) => t.id === w.teacherId);
                const freePeriods = Math.max(0, w.maxWeeklyPeriods - w.assignedPeriodsCount);

                let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                let barColor = 'bg-emerald-500';

                if (w.status === 'overloaded') {
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
                  barColor = 'bg-rose-500';
                } else if (w.status === 'heavy') {
                  badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  barColor = 'bg-amber-500';
                } else if (w.status === 'underloaded') {
                  badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
                  barColor = 'bg-sky-500';
                }

                return (
                  <tr key={w.teacherId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Teacher & Dept */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{w.teacherName}</div>
                      <div className="text-[11px] text-slate-500">{teacher?.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{w.department}</div>
                    </td>

                    {/* Subjects */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {w.subjectsTaught.length > 0 ? (
                          w.subjectsTaught.map((sub) => (
                            <span
                              key={sub}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None scheduled</span>
                        )}
                      </div>
                    </td>

                    {/* Periods / Cap */}
                    <td className="py-3.5 px-3 text-center tabular-nums">
                      <div className="font-bold text-slate-900 text-sm">
                        {w.assignedPeriodsCount}{' '}
                        <span className="text-slate-400 text-xs font-normal">/ {w.maxWeeklyPeriods}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {freePeriods > 0 ? `${freePeriods} free slots` : 'No free slots'}
                      </div>
                    </td>

                    {/* Utilization Bar */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700 tabular-nums">
                          {w.workloadPercentage}%
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border ${badgeColor}`}>
                          {w.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${Math.min(100, w.workloadPercentage)}%` }}
                        />
                      </div>
                    </td>

                    {/* Duties */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center font-bold text-slate-900 bg-slate-100 rounded-full w-6 h-6 text-xs tabular-nums">
                        {w.assignedDutiesCount}
                      </span>
                    </td>

                    {/* Daily Breakdown */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600 font-mono">
                        <span title="Mon" className="bg-slate-100 px-1 rounded">
                          M:{w.periodsPerDay.Monday}
                        </span>
                        <span title="Tue" className="bg-slate-100 px-1 rounded">
                          T:{w.periodsPerDay.Tuesday}
                        </span>
                        <span title="Wed" className="bg-slate-100 px-1 rounded">
                          W:{w.periodsPerDay.Wednesday}
                        </span>
                        <span title="Thu" className="bg-slate-100 px-1 rounded">
                          Th:{w.periodsPerDay.Thursday}
                        </span>
                        <span title="Fri" className="bg-slate-100 px-1 rounded">
                          F:{w.periodsPerDay.Friday}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectedTeacherId(w.teacherId)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Inspect weekly timetable"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenAssignDuty(w.teacherId)}
                          className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors whitespace-nowrap"
                        >
                          + Assign Duty
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Individual Teacher Timetable Modal */}
      {inspectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {inspectedTeacher.name} — Individual Weekly Teaching Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectedTeacher.title} · {inspectedTeacher.department} · {inspectedWorkload?.assignedPeriodsCount} Periods / Week
                </p>
              </div>
              <button
                onClick={() => setInspectedTeacherId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 bg-slate-100 rounded"
              >
                Close
              </button>
            </div>

            <div className="py-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="p-2 font-bold w-24">Day</th>
                    {timeSlots.map((slot) => (
                      <th key={slot.index} className="p-2 text-center border-l border-slate-200">
                        <div className="font-bold">{slot.label}</div>
                        <div className="text-[10px] text-slate-500">{slot.startTime}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map((day) => (
                    <tr key={day} className="border-b border-slate-200">
                      <td className="p-2 font-semibold text-slate-900 bg-slate-50">{day}</td>
                      {timeSlots.map((slot) => {
                        if (slot.isBreak) {
                          return (
                            <td key={slot.index} className="p-1 bg-slate-100/60 text-center text-[10px] text-slate-400 italic">
                              Break
                            </td>
                          );
                        }
                        const p = periods.find(
                          (item) =>
                            item.teacherId === inspectedTeacher.id &&
                            item.dayOfWeek === day &&
                            item.slotIndex === slot.index
                        );
                        return (
                          <td key={slot.index} className="p-1.5 border-l border-slate-200 text-center">
                            {p ? (
                              <div className="bg-indigo-50 border border-indigo-200 rounded p-1">
                                <div className="font-bold text-indigo-900 truncate">{p.subject}</div>
                                <div className="text-[10px] text-indigo-700">{p.gradeName}</div>
                                <div className="text-[9px] text-slate-500 font-mono">{p.room}</div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Contact: {inspectedTeacher.email} · {inspectedTeacher.phone}
              </span>
              <button
                onClick={() => {
                  setInspectedTeacherId(null);
                  onOpenAssignDuty(inspectedTeacher.id);
                }}
                className="px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                + Assign Additional Duty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
