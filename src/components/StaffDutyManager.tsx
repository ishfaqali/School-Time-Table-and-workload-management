import React, { useState } from 'react';
import {
  ShieldAlert,
  PlusCircle,
  FileDown,
  CheckCircle2,
  Clock,
  MapPin,
  Trash2,
  Search,
  Filter,
  Users,
  Briefcase,
  AlertCircle,
  X,
} from 'lucide-react';
import type { StaffMember, SupportDuty, DutyCategory, DayOfWeek } from '../types/index.ts';
import { exportStaffDutiesPDF } from '../utils/pdfExport.ts';

interface StaffDutyManagerProps {
  staff: StaffMember[];
  duties: SupportDuty[];
  onAddDuty: (duty: SupportDuty) => void;
  onUpdateDutyStatus: (dutyId: string, status: 'scheduled' | 'completed' | 'substituted') => void;
  onDeleteDuty: (dutyId: string) => void;
  preselectedStaffId?: string | null;
  onClearPreselectedStaff?: () => void;
}

const DUTY_CATEGORIES: DutyCategory[] = [
  'Gate Duty',
  'Recess Supervision',
  'Exam Invigilation',
  'Bus Monitoring',
  'Science Lab Setup',
  'Campus Security & Patrol',
  'First Aid & Medical',
  'Cafeteria Oversight',
  'Assembly Logistics',
  'Facilities & Hygiene',
];

export const StaffDutyManager: React.FC<StaffDutyManagerProps> = ({
  staff,
  duties,
  onAddDuty,
  onUpdateDutyStatus,
  onDeleteDuty,
  preselectedStaffId,
  onClearPreselectedStaff,
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'support'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form State
  const [formStaffId, setFormStaffId] = useState(preselectedStaffId || staff[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DutyCategory>('Gate Duty');
  const [formDay, setFormDay] = useState<DayOfWeek>('Monday');
  const [formTimeSlot, setFormTimeSlot] = useState('07:30 - 08:30 AM');
  const [formLocation, setFormLocation] = useState('North Main Entrance');
  const [formInstructions, setFormInstructions] = useState('');

  // Handle external preselection (e.g. from teacher workload page)
  React.useEffect(() => {
    if (preselectedStaffId) {
      setFormStaffId(preselectedStaffId);
      setShowAssignModal(true);
      if (onClearPreselectedStaff) {
        onClearPreselectedStaff();
      }
    }
  }, [preselectedStaffId, onClearPreselectedStaff]);

  const teachingStaff = staff.filter((s) => s.role === 'teacher');
  const supportStaff = staff.filter((s) => s.role === 'support');

  const filteredDuties = duties.filter((d) => {
    const matchesRole = roleFilter === 'all' || d.staffRole === roleFilter;
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    const matchesSearch =
      d.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesCategory && matchesSearch;
  });

  const handleSaveDuty = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedStaff = staff.find((s) => s.id === formStaffId);
    if (!assignedStaff) return;

    const newDuty: SupportDuty = {
      id: `duty-${Date.now()}`,
      title: formTitle.trim() || `${formCategory} - ${formLocation}`,
      staffId: assignedStaff.id,
      staffName: assignedStaff.name,
      staffRole: assignedStaff.role,
      category: formCategory,
      dayOfWeek: formDay,
      timeSlot: formTimeSlot,
      location: formLocation,
      instructions: formInstructions || 'Standard duty protocol applies.',
      status: 'scheduled',
      dateAssigned: new Date().toISOString().split('T')[0],
    };

    onAddDuty(newDuty);
    setShowAssignModal(false);
    // Reset form
    setFormTitle('');
    setFormInstructions('');
  };

  const handleExportPDF = () => {
    exportStaffDutiesPDF(duties, staff, {
      schoolName: 'Oakridge International Academy',
      academicYear: '2026 - 2027',
      term: 'Fall Term 1',
      title: 'School Staff Duty Roster',
      subtitle: 'Official Duty Assignments for All Teaching & Support Staff',
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Assigned Duties</span>
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{duties.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {duties.filter((d) => d.status === 'scheduled').length} pending ·{' '}
            {duties.filter((d) => d.status === 'completed').length} completed
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Teaching Staff Duties</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {duties.filter((d) => d.staffRole === 'teacher').length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Recess yard patrol, invigilation, assembly
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Support Staff Duties</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {duties.filter((d) => d.staffRole === 'support').length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Lab prep, security gates, fleet & nurse checks
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff, duty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
            >
              <option value="all">All Personnel ({staff.length})</option>
              <option value="teacher">Teaching Staff Only ({teachingStaff.length})</option>
              <option value="support">Support Staff Only ({supportStaff.length})</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
            >
              <option value="all">All Categories</option>
              {DUTY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Print Duty Roster PDF</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Assign New Duty</span>
          </button>
        </div>
      </div>

      {/* Duties Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Staff Member</th>
                <th className="py-3 px-3 font-semibold">Duty Title & Category</th>
                <th className="py-3 px-3 font-semibold">Schedule & Location</th>
                <th className="py-3 px-3 font-semibold">Instructions</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredDuties.length > 0 ? (
                filteredDuties.map((duty) => {
                  const staffObj = staff.find((s) => s.id === duty.staffId);
                  return (
                    <tr key={duty.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Staff Member */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{duty.staffName}</div>
                        <div className="text-[11px] text-slate-500">{staffObj?.title}</div>
                        <div className="mt-0.5">
                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                              duty.staffRole === 'support'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {duty.staffRole === 'support' ? 'Support Staff' : 'Faculty'}
                          </span>
                        </div>
                      </td>

                      {/* Duty Title */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{duty.title}</div>
                        <div className="text-[11px] text-indigo-600 font-medium">{duty.category}</div>
                      </td>

                      {/* Schedule & Location */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-slate-800 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{duty.dayOfWeek}, {duty.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{duty.location}</span>
                        </div>
                      </td>

                      {/* Instructions */}
                      <td className="py-3.5 px-3 max-w-xs text-slate-600 text-[11px]">
                        {duty.instructions}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={duty.status}
                          onChange={(e) =>
                            onUpdateDutyStatus(
                              duty.id,
                              e.target.value as 'scheduled' | 'completed' | 'substituted'
                            )
                          }
                          className={`text-xs font-semibold rounded px-2 py-1 border transition-colors ${
                            duty.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : duty.status === 'substituted'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="substituted">Substituted</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteDuty(duty.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Remove duty assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No duties matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Duty Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Duty (Teachers & Support Staff)
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDuty} className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Staff Member</label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                >
                  <optgroup label="Teaching Faculty">
                    {teachingStaff.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.department}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Support Staff (Operations, Lab, Transport, Health, Security)">
                    {supportStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.title} ({s.department})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Duty Title</label>
                <input
                  type="text"
                  placeholder="e.g. Science Lab B Apparatus Preparation"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Duty Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DutyCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {DUTY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Time Slot / Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:30 - 08:30 AM"
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Campus Location</label>
                  <input
                    type="text"
                    placeholder="e.g. North Gate / Exam Hall / Lab 2"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Specific Operational Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail responsibilities, checklist items, key safety protocols..."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
