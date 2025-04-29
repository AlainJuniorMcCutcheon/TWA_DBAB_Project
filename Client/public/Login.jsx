/* Login */
import React, { useState } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths } from 'date-fns';

function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const renderHeader = () => (
    <div className="calendar-header">
      <button onClick={handlePrevMonth}>&lt;</button>
      <span>{format(currentMonth, 'MMMM yyyy')}</span>
      <button onClick={handleNextMonth}>&gt;</button>
    </div>
  );

  const renderDays = () => (
    <div className="calendar-grid">
      {daysInMonth.map((day) => (
        <div key={day.toString()} className="calendar-day">
          {format(day, 'd')}
        </div>
      ))}
    </div>
  );

  return (
    <div className="calendar">
      {renderHeader()}
      {renderDays()}
    </div>
  );
}

export default Calendar;
/*will ned more logic in final stages */