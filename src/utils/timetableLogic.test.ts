import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectClashes,
  calculateTeacherWorkloads,
  filterUpcomingDeadlines,
  generateWindowsSetupScript,
} from './timetableLogic.ts';
import type { ClassPeriod, StaffMember, SupportDuty, AssignmentDeadline } from '../types/index.ts';

test('detectClashes detects teacher assigned to two classes simultaneously', () => {
  const existingPeriods: ClassPeriod[] = [
    {
      id: 'p1',
      gradeId: 'g9a',
      gradeName: 'Grade 9-A',
      dayOfWeek: 'Monday',
      slotIndex: 1,
      subject: 'Mathematics',
      teacherId: 't1',
      teacherName: 'Dr. John Adams',
      room: 'Room 101',
    },
  ];

  const candidate = {
    gradeId: 'g10b',
    dayOfWeek: 'Monday' as const,
    slotIndex: 1,
    subject: 'Advanced Algebra',
    teacherId: 't1',
    teacherName: 'Dr. John Adams',
    room: 'Room 205',
  };

  const clashes = detectClashes(existingPeriods, candidate);
  assert.equal(clashes.length, 1);
  assert.equal(clashes[0].type, 'teacher');
  assert.match(clashes[0].conflictDescription, /Dr\. John Adams/);
});

test('detectClashes detects room booked twice at same day and time slot', () => {
  const existingPeriods: ClassPeriod[] = [
    {
      id: 'p1',
      gradeId: 'g9a',
      gradeName: 'Grade 9-A',
      dayOfWeek: 'Tuesday',
      slotIndex: 3,
      subject: 'Physics',
      teacherId: 't2',
      teacherName: 'Prof. Mary Curie',
      room: 'Physics Lab A',
    },
  ];

  const candidate = {
    gradeId: 'g11c',
    dayOfWeek: 'Tuesday' as const,
    slotIndex: 3,
    subject: 'General Science',
    teacherId: 't3',
    teacherName: 'Mr. Alan Turing',
    room: 'Physics Lab A', // Same room
  };

  const clashes = detectClashes(existingPeriods, candidate);
  assert.equal(clashes.length, 1);
  assert.equal(clashes[0].type, 'room');
  assert.match(clashes[0].conflictDescription, /Physics Lab A/);
});

test('detectClashes returns empty array when there are no conflicts', () => {
  const existingPeriods: ClassPeriod[] = [
    {
      id: 'p1',
      gradeId: 'g9a',
      gradeName: 'Grade 9-A',
      dayOfWeek: 'Monday',
      slotIndex: 1,
      subject: 'Mathematics',
      teacherId: 't1',
      teacherName: 'Dr. John Adams',
      room: 'Room 101',
    },
  ];

  const candidate = {
    gradeId: 'g9a',
    dayOfWeek: 'Monday' as const,
    slotIndex: 2, // Different slot!
    subject: 'English',
    teacherId: 't4',
    teacherName: 'Ms. Emily Bronte',
    room: 'Room 101',
  };

  const clashes = detectClashes(existingPeriods, candidate);
  assert.equal(clashes.length, 0);
});

test('calculateTeacherWorkloads computes periods, duty counts, and flags overload', () => {
  const teachers: StaffMember[] = [
    {
      id: 't1',
      name: 'Dr. John Adams',
      role: 'teacher',
      title: 'Senior Math Teacher',
      department: 'Mathematics',
      email: 'adams@school.edu',
      phone: '555-0101',
      maxWeeklyPeriods: 20,
      subjects: ['Mathematics'],
      avatarColor: 'indigo',
    },
  ];

  // 22 periods scheduled for t1 (exceeds max 20)
  const periods: ClassPeriod[] = Array.from({ length: 22 }).map((_, i) => ({
    id: `p-${i}`,
    gradeId: 'g9',
    gradeName: 'Grade 9',
    dayOfWeek: 'Monday',
    slotIndex: i % 7,
    subject: 'Mathematics',
    teacherId: 't1',
    teacherName: 'Dr. John Adams',
    room: '101',
  }));

  const duties: SupportDuty[] = [
    {
      id: 'd1',
      title: 'Morning Gate Inspection',
      staffId: 't1',
      staffName: 'Dr. John Adams',
      staffRole: 'teacher',
      category: 'Gate Duty',
      dayOfWeek: 'Monday',
      timeSlot: '07:30 - 08:00 AM',
      location: 'Main North Gate',
      instructions: 'Check student IDs',
      status: 'scheduled',
      dateAssigned: '2026-10-14',
    },
  ];

  const workloads = calculateTeacherWorkloads(teachers, periods, duties);
  assert.equal(workloads.length, 1);
  assert.equal(workloads[0].assignedPeriodsCount, 22);
  assert.equal(workloads[0].assignedDutiesCount, 1);
  assert.equal(workloads[0].status, 'overloaded');
  assert.equal(workloads[0].workloadPercentage, 110);
});

test('filterUpcomingDeadlines filters out completed and out-of-range items', () => {
  const deadlines: AssignmentDeadline[] = [
    {
      id: 'd1',
      title: 'Math Quiz 1',
      gradeId: 'g9',
      gradeName: 'Grade 9-A',
      subject: 'Math',
      dueDate: '2026-10-15',
      dueTime: '10:00',
      description: 'Algebra chapter 1',
      assignedTeacherId: 't1',
      assignedTeacherName: 'Dr. Adams',
      priority: 'high',
      completed: false,
    },
    {
      id: 'd2',
      title: 'Past Assignment',
      gradeId: 'g9',
      gradeName: 'Grade 9-A',
      subject: 'Math',
      dueDate: '2026-10-10',
      dueTime: '10:00',
      description: 'Old test',
      assignedTeacherId: 't1',
      assignedTeacherName: 'Dr. Adams',
      priority: 'low',
      completed: true,
    },
  ];

  const filtered = filterUpcomingDeadlines(deadlines, '2026-10-14', 7);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'd1');
});

test('generateWindowsSetupScript generates valid batch launcher with school name', () => {
  const script = generateWindowsSetupScript('St. Patrick High School', 'https://school-app.run.app');
  assert.match(script, /St\. Patrick High School/);
  assert.match(script, /msedge\.exe --app=/);
  assert.match(script, /SchoolTimetablePro/);
});
