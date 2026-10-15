import { jsPDF } from 'jspdf';
import type { ClassPeriod, GradeClass, StaffMember, SupportDuty, TimeSlotConfig } from '../types/index.ts';
import { DAYS_OF_WEEK } from '../data/mockData.ts';

export interface PDFExportOptions {
  schoolName: string;
  academicYear: string;
  term: string;
  title: string;
  subtitle: string;
}

/**
 * Generates and triggers download of a high-resolution, printable vector PDF for a Class Timetable.
 */
export function exportClassTimetablePDF(
  selectedClass: GradeClass,
  timeSlots: TimeSlotConfig[],
  periods: ClassPeriod[],
  options: PDFExportOptions
) {
  // Landscape A4 orientation: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;

  // Header background banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, margin, pageWidth - margin * 2, 22, 'F');

  // School Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(options.schoolName.toUpperCase(), margin + 6, margin + 9);

  // Subtitle / Term
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(
    `Official Class Schedule  ·  ${selectedClass.name} (${selectedClass.roomNumber})  ·  Class Teacher: ${selectedClass.classTeacherName}`,
    margin + 6,
    margin + 16
  );

  // Academic metadata right aligned
  doc.text(`Academic Year: ${options.academicYear}  |  ${options.term}`, pageWidth - margin - 6, margin + 12, {
    align: 'right',
  });

  // Timetable Grid Layout
  const startY = margin + 27;
  const availableWidth = pageWidth - margin * 2;
  const daysColWidth = 28;
  const slotCount = timeSlots.length;
  const slotColWidth = (availableWidth - daysColWidth) / slotCount;
  const rowHeight = 22;

  // Header Row (Time Slots)
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(margin, startY, availableWidth, 12, 'F');
  doc.setDrawColor(203, 213, 225); // Border
  doc.setLineWidth(0.3);
  doc.rect(margin, startY, availableWidth, 12, 'S');

  // Days header label
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DAY / TIME', margin + 3, startY + 8);

  // Slot column headers
  timeSlots.forEach((slot, i) => {
    const x = margin + daysColWidth + i * slotColWidth;
    doc.line(x, startY, x, startY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(slot.label, x + slotColWidth / 2, startY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${slot.startTime} - ${slot.endTime}`, x + slotColWidth / 2, startY + 9.5, { align: 'center' });
    doc.setTextColor(51, 65, 85);
  });

  // Table Body Rows (Days)
  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    const currentY = startY + 12 + dayIndex * rowHeight;

    // Day Header Cell
    doc.setFillColor(dayIndex % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(margin, currentY, daysColWidth, rowHeight, 'F');
    doc.rect(margin, currentY, daysColWidth, rowHeight, 'S');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(day, margin + 4, currentY + rowHeight / 2 + 1);

    // Slots for this day
    timeSlots.forEach((slot, slotIdx) => {
      const cellX = margin + daysColWidth + slotIdx * slotColWidth;

      if (slot.isBreak) {
        // Break cell
        doc.setFillColor(243, 244, 246);
        doc.rect(cellX, currentY, slotColWidth, rowHeight, 'F');
        doc.rect(cellX, currentY, slotColWidth, rowHeight, 'S');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text(slot.breakTitle || 'Break', cellX + slotColWidth / 2, currentY + rowHeight / 2 + 1, {
          align: 'center',
        });
      } else {
        // Regular class slot
        const period = periods.find(
          (p) => p.gradeId === selectedClass.id && p.dayOfWeek === day && p.slotIndex === slot.index
        );

        doc.setFillColor(period ? 255 : 255, 255, 255);
        doc.rect(cellX, currentY, slotColWidth, rowHeight, 'F');
        doc.rect(cellX, currentY, slotColWidth, rowHeight, 'S');

        if (period) {
          // Subject
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(period.subject, cellX + slotColWidth / 2, currentY + 6.5, {
            align: 'center',
            maxWidth: slotColWidth - 2,
          });

          // Teacher
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(71, 85, 105);
          doc.text(period.teacherName, cellX + slotColWidth / 2, currentY + 11.5, {
            align: 'center',
            maxWidth: slotColWidth - 2,
          });

          // Room
          doc.setFontSize(6);
          doc.setTextColor(100, 116, 139);
          doc.text(period.room, cellX + slotColWidth / 2, currentY + 16.5, {
            align: 'center',
            maxWidth: slotColWidth - 2,
          });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(203, 213, 225);
          doc.text('-', cellX + slotColWidth / 2, currentY + rowHeight / 2 + 1, { align: 'center' });
        }
      }
    });
  });

  // Footer & Signatures
  const footerY = pageHeight - margin - 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized by Academic Coordinator: ________________________', margin, footerY + 8);
  doc.text('Principal Signature: ________________________', pageWidth / 2, footerY + 8);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} · School Timetable Pro`,
    pageWidth - margin,
    footerY + 8,
    { align: 'right' }
  );

  // Trigger download
  doc.save(`${selectedClass.name.replace(/\s+/g, '_')}_Timetable.pdf`);
}

/**
 * Generates and downloads the Staff Additional Duties Roster PDF
 */
export function exportStaffDutiesPDF(
  duties: SupportDuty[],
  staffList: StaffMember[],
  options: PDFExportOptions
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const margin = 14;

  // Header
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(margin, margin, pageWidth - margin * 2, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${options.schoolName.toUpperCase()} — ALL-STAFF DUTY ROSTER`, margin + 6, margin + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Official Duty Assignment Sheet for Teaching & Support Staff  ·  ${options.academicYear} ${options.term}`,
    margin + 6,
    margin + 15
  );

  // Table columns
  const startY = margin + 26;
  const rowHeight = 12;
  const cols = [
    { label: 'STAFF MEMBER & ROLE', width: 60 },
    { label: 'DUTY CATEGORY', width: 45 },
    { label: 'SCHEDULED DAY & TIME', width: 45 },
    { label: 'CAMPUS LOCATION', width: 40 },
    { label: 'SPECIFIC INSTRUCTIONS', width: 55 },
    { label: 'STATUS', width: 24 },
  ];

  // Header Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, startY, pageWidth - margin * 2, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, startY, pageWidth - margin * 2, 9, 'S');

  let currentX = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  cols.forEach((col) => {
    doc.text(col.label, currentX + 3, startY + 6);
    currentX += col.width;
  });

  // Duty Rows
  let currentY = startY + 9;
  duties.forEach((duty, idx) => {
    if (currentY > 185) {
      doc.addPage();
      currentY = margin + 10;
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F');
    doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'S');

    const staff = staffList.find((s) => s.id === duty.staffId);
    let rowX = margin;

    // Staff Member
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(duty.staffName, rowX + 3, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${staff?.title || ''} (${duty.staffRole.toUpperCase()})`, rowX + 3, currentY + 9);
    rowX += cols[0].width;

    // Category
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(duty.category, rowX + 3, currentY + 7);
    rowX += cols[1].width;

    // Day & Time
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`${duty.dayOfWeek}, ${duty.timeSlot}`, rowX + 3, currentY + 7);
    rowX += cols[2].width;

    // Location
    doc.text(duty.location, rowX + 3, currentY + 7);
    rowX += cols[3].width;

    // Instructions
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(duty.instructions, rowX + 3, currentY + 7, { maxWidth: cols[4].width - 4 });
    rowX += cols[4].width;

    // Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(duty.status === 'completed' ? 22 : 180, duty.status === 'completed' ? 101 : 83, 9);
    doc.text(duty.status.toUpperCase(), rowX + 3, currentY + 7);

    currentY += rowHeight;
  });

  doc.save('School_Staff_Duty_Roster.pdf');
}
