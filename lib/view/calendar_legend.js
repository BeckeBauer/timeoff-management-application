'use strict';

module.exports = ({calendar, leaveTypes, showAbsences}) => {
  const leaveTypeIds = new Set();
  let hasPublicHolidays = false;
  let hasPendingAbsences = false;

  calendar.forEach(month => {
    month.weeks.forEach(week => {
      week.forEach(day => {
        if (day.is_bank_holiday) {
          hasPublicHolidays = true;
        }
        if (day.is_new_leave) {
          hasPendingAbsences = true;
        } else {
          if (day.morning_leave_type_id !== undefined && day.morning_leave_type_id !== null) {
            leaveTypeIds.add(String(day.morning_leave_type_id));
          }
          if (day.afternoon_leave_type_id !== undefined && day.afternoon_leave_type_id !== null) {
            leaveTypeIds.add(String(day.afternoon_leave_type_id));
          }
        }
      });
    });
  });

  const absenceTypes = showAbsences
    ? leaveTypes
      .filter(leaveType => leaveTypeIds.has(String(leaveType.id)))
      .map(leaveType => ({
        name: leaveType.name,
        color_class: leaveType.get_color_class(),
      }))
    : [];
  const showPendingAbsences = showAbsences && hasPendingAbsences;

  return {
    show: hasPublicHolidays || absenceTypes.length > 0 || showPendingAbsences,
    has_public_holidays: hasPublicHolidays,
    absence_types: absenceTypes,
    has_pending_absences: showPendingAbsences,
    show_absences: showAbsences,
  };
};
