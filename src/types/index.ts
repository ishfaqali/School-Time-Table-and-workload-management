export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type StaffRole = 'teacher' | 'support';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  title: string;
  department: string;
  email: string;
  phone: string;
  maxWeeklyPeriods: number; // e.g. 24 for teachers, 0 for support
  subjects: string[];
  avatarColor: string;
  notes?: string;
}

export type DutyCategory = 
  | 'Gate Duty'
  | 'Recess Supervision'
  | 'Exam Invigilation'
  | 'Bus Monitoring'
  | 'Science Lab Setup'
  | 'Campus Security & Patrol'
  | 'First Aid & Medical'
  | 'Cafeteria Oversight'
  | 'Assembly Logistics'
  | 'Facilities & Hygiene';

export interface SupportDuty {
  id: string;
  title: string;
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  category: DutyCategory;
  dayOfWeek: DayOfWeek;
  timeSlot: string; // e.g. "07:30 - 08:15 AM"
  location: string;
  instructions: string;
  status: 'scheduled' | 'completed' | 'substituted';
  dateAssigned: string;
}

export interface TimeSlotConfig {
  index: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  breakTitle?: string;
}

export interface ClassPeriod {
  id: string;
  gradeId: string;
  gradeName: string;
  dayOfWeek: DayOfWeek;
  slotIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
  color?: string;
}

export interface GradeClass {
  id: string;
  name: string; // e.g. 'Grade 9-A'
  roomNumber: string;
  classTeacherId: string;
  classTeacherName: string;
  studentCount: number;
  section: string;
}

export interface AssignmentDeadline {
  id: string;
  title: string;
  gradeId: string;
  gradeName: string;
  subject: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  description: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface ClashResult {
  type: 'teacher' | 'room';
  conflictDescription: string;
  slotIndex: number;
  dayOfWeek: DayOfWeek;
  existingPeriod: ClassPeriod;
  conflictingPeriod: Partial<ClassPeriod>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'class_upcoming' | 'deadline_due' | 'duty_alert' | 'sync_success' | 'workload_warning';
  timestamp: string;
  read: boolean;
}

export interface TeacherWorkloadSummary {
  teacherId: string;
  teacherName: string;
  department: string;
  maxWeeklyPeriods: number;
  assignedPeriodsCount: number;
  assignedDutiesCount: number;
  workloadPercentage: number;
  status: 'underloaded' | 'optimal' | 'heavy' | 'overloaded';
  periodsPerDay: Record<DayOfWeek, number>;
  subjectsTaught: string[];
}
