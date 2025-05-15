import React, { useState } from "react";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const Calendar = ({ reservations }) => {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const reservationEvents = Array.isArray(reservations)
    ? reservations.map((res, index) => {
        const checkIn = new Date(res.checkIn);
        const checkOut = new Date(res.checkOut);

        if (isNaN(checkIn) || isNaN(checkOut)) {
          console.warn(`Invalid date in reservation ${index}`, res);
          return null;
        }

        return {
          title: `${res.guest} - ${res.listingTitle}`,
          start: checkIn,
          end: checkOut,
          allDay: true,
        };
      }).filter(Boolean)
    : [];

  const fallbackEvents = [
    {
    },
  ];

  const events = reservationEvents.length > 0 ? reservationEvents : fallbackEvents;

  return (
    <div style={{ height: "700px", padding: "1rem" }}>
      <h2>Reservation Calendar</h2>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "day"]}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        style={{ height: "100%" }}
      />
    </div>
  );
};

export default Calendar;
