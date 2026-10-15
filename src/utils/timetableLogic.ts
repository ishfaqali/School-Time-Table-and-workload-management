import type {
  StaffMember,
  ClassPeriod,
  SupportDuty,
  TeacherWorkloadSummary,
  ClashResult,
  DayOfWeek,
  AssignmentDeadline,
} from '../types/index.ts';

/**
 * Detects conflicts when scheduling a class period.
 * 1. Teacher clash: A teacher cannot teach two different classes at the same day & time slot.
 * 2. Room clash: A room cannot host two different classes at the same day & time slot.
 */
export function detectClashes(
  existingPeriods: ClassPeriod[],
  candidate: {
    id?: string;
    gradeId?: string;
    teacherId: string;
    teacherName?: string;
    room: string;
    dayOfWeek: DayOfWeek;
    slotIndex: number;
  }
): ClashResult[] {
  const clashes: ClashResult[] = [];

  for (const period of existingPeriods) {
    // Skip self if updating an existing scheduled period
    if (candidate.id && period.id === candidate.id) {
      continue;
    }

    // Only compare slots on the same day and time slot
    if (period.dayOfWeek === candidate.dayOfWeek && period.slotIndex === candidate.slotIndex) {
      // 1. Teacher conflict check (if teacherId is assigned)
      if (candidate.teacherId && period.teacherId === candidate.teacherId) {
        clashes.push({
          type: 'teacher',
          conflictDescription: `Teacher "${period.teacherName || 'Assigned Teacher'}" is already scheduled in ${period.gradeName} (${period.subject}) at this time.`,
          slotIndex: period.slotIndex,
          dayOfWeek: period.dayOfWeek,
          existingPeriod: period,
          conflictingPeriod: candidate,
        });
      }

      // 2. Room conflict check (if room is assigned and not empty)
      if (candidate.room && period.room && candidate.room.trim().toLowerCase() === period.room.trim().toLowerCase()) {
        clashes.push({
          type: 'room',
          conflictDescription: `Room "${period.room}" is already booked by ${period.gradeName} for ${period.subject}.`,
          slotIndex: period.slotIndex,
          dayOfWeek: period.dayOfWeek,
          existingPeriod: period,
          conflictingPeriod: candidate,
        });
      }
    }
  }

  return clashes;
}

/**
 * Computes workload statistics for every teacher.
 * Calculates total assigned periods, workload percentage based on their target max periods,
 * counts additional duties, and flags overload status (> 100%).
 */
export function calculateTeacherWorkloads(
  teachers: StaffMember[],
  periods: ClassPeriod[],
  duties: SupportDuty[]
): TeacherWorkloadSummary[] {
  const teacherList = teachers.filter((s) => s.role === 'teacher');

  return teacherList.map((teacher) => {
    const teacherPeriods = periods.filter((p) => p.teacherId === teacher.id);
    const teacherDuties = duties.filter((d) => d.staffId === teacher.id);

    const periodsPerDay: Record<DayOfWeek, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    const subjectsSet = new Set<string>();

    for (const p of teacherPeriods) {
      if (periodsPerDay[p.dayOfWeek] !== undefined) {
        periodsPerDay[p.dayOfWeek] += 1;
      }
      if (p.subject) {
        subjectsSet.add(p.subject);
      }
    }

    const assignedCount = teacherPeriods.length;
    const maxPeriods = teacher.maxWeeklyPeriods > 0 ? teacher.maxWeeklyPeriods : 24;
    const percentage = Math.round((assignedCount / maxPeriods) * 100);

    let status: 'underloaded' | 'optimal' | 'heavy' | 'overloaded' = 'optimal';
    if (percentage < 65) {
      status = 'underloaded';
    } else if (percentage <= 90) {
      status = 'optimal';
    } else if (percentage <= 100) {
      status = 'heavy';
    } else {
      status = 'overloaded';
    }

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      department: teacher.department,
      maxWeeklyPeriods: maxPeriods,
      assignedPeriodsCount: assignedCount,
      assignedDutiesCount: teacherDuties.length,
      workloadPercentage: percentage,
      status,
      periodsPerDay,
      subjectsTaught: Array.from(subjectsSet),
    };
  });
}

/**
 * Finds upcoming deadlines within a given window (e.g. today or next 7 days).
 */
export function filterUpcomingDeadlines(
  deadlines: AssignmentDeadline[],
  targetDateIso: string,
  includeUpcomingDays: number = 7
): AssignmentDeadline[] {
  const target = new Date(targetDateIso);
  const maxDate = new Date(target);
  maxDate.setDate(maxDate.getDate() + includeUpcomingDays);

  return deadlines
    .filter((d) => {
      if (d.completed) return false;
      const dDate = new Date(d.dueDate);
      return dDate >= target && dDate <= maxDate;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`).getTime();
      const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`).getTime();
      return dateA - dateB;
    });
}

/**
 * Generates an automated Windows batch installer / launcher script (.bat/.cmd)
 * that creates a standalone Windows desktop app runner with a dedicated executable
 * shortcut and webview container.
 */
export function generateWindowsSetupScript(schoolName: string, appUrl: string): string {
  return `@echo off
title ${schoolName} - Desktop Timetable Software Installer
color 1F
echo ===============================================================================
echo     ${schoolName}
echo     Desktop Software Launcher & Local Client Setup (Windows x64 / x86)
echo ===============================================================================
echo.
echo [1/3] Configuring standalone application cache...
set APP_DIR=%LOCALAPPDATA%\\SchoolTimetablePro
if not exist "%APP_DIR%" mkdir "%APP_DIR%"

echo [2/3] Creating Windows Desktop Shortcut...
set SCRIPT_VBS="%TEMP%\\CreateTimetableShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT_VBS%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\${schoolName} Timetable.lnk" >> %SCRIPT_VBS%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT_VBS%
echo oLink.TargetPath = "msedge.exe" >> %SCRIPT_VBS%
echo oLink.Arguments = "--app=${appUrl} --start-maximized" >> %SCRIPT_VBS%
echo oLink.Description = "School Timetable Pro Desktop Application" >> %SCRIPT_VBS%
echo oLink.Save >> %SCRIPT_VBS%
cscript /nologo %SCRIPT_VBS%
del %SCRIPT_VBS%

echo [3/3] Launching ${schoolName} Timetable in Dedicated Desktop App Mode...
start msedge.exe --app=${appUrl} --start-maximized

echo.
echo Setup successfully completed! A desktop shortcut has been created on your Windows desktop.
echo You can now run this software anytime offline or online from your desktop.
timeout /t 3 >nul
exit
`;
}
