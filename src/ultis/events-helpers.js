/**
 * @file Event-list utilities shared across layouts: filtering by month/period,
 * detecting overlaps, sorting, and picking a display color for a chip.
 */

/**
 * Events relevant to the month grid shown for `pDateString`: those inside the month
 * itself, plus any bleeding in from the last week of the previous month or the first
 * week of the next month (the grid's leading/trailing cells).
 */
export function filterEventsByMonth(pEvents, pDateString) {
    const [year, month] = pDateString.split("-").map(Number);

    const startOfCurrentMonth = new Date(year, month - 1, 1);
    const endOfCurrentMonth = new Date(year, month, 0);

    const startOfPreviousMonth = new Date(year, month - 2, 1);
    const endOfPreviousMonth = new Date(year, month - 1, 0);

    const startOfNextMonth = new Date(year, month, 1);
    const endOfFirstWeekNextMonth = new Date(year, month, 7);

    const startOfLastWeekPreviousMonth = new Date(endOfPreviousMonth);
    startOfLastWeekPreviousMonth.setDate(endOfPreviousMonth.getDate() - 6);

    return pEvents.filter(event => {
        const eventStart = new Date(`${event.period.from.date}T${event.period.from.time}`);
        const eventEnd = new Date(`${event.period.to.date || event.period.from.date}T${event.period.to.time}`);

        return (
            (eventEnd >= startOfLastWeekPreviousMonth && eventStart <= endOfPreviousMonth) ||
            (eventEnd >= startOfCurrentMonth && eventStart <= endOfCurrentMonth) ||
            (eventEnd >= startOfNextMonth && eventStart <= endOfFirstWeekNextMonth)
        );
    });
}

/**
 * Every event of the same type that directly or transitively overlaps `pRefEvent` in
 * time (a chain: if A overlaps B and B overlaps C, all three are returned even if A
 * and C don't directly overlap). Used to size/position side-by-side overlapping chips
 * in the day/period layouts. An event with no `period.to` is treated as 30 minutes long.
 */
export function filterEventsByPeriod(pEvents, pRefEvent) {
  function getPeriod(pEvent) {
    const pFromDateTime = new Date(`${pEvent.period.from.date}T${pEvent.period.from.time}`);
    const pToDate = pEvent.period.to && pEvent.period.to.date ? pEvent.period.to.date : pEvent.period.from.date;
    const pToTime = pEvent.period.to && pEvent.period.to.time ? pEvent.period.to.time : (() => {
      const dt = new Date(`${pEvent.period.from.date}T${pEvent.period.from.time}`);
      dt.setMinutes(dt.getMinutes() + 30);
      return dt.toTimeString().slice(0, 5);
    })();
    const pToDateTime = new Date(`${pToDate}T${pToTime}`);
    return { from: pFromDateTime, to: pToDateTime };
  }
  const pResult = [];
  const pVisited = new Set();
  const pQueue = [pRefEvent];
  pVisited.add(pRefEvent.id);
  while (pQueue.length) {
    const pCurrent = pQueue.shift();
    const pCurrentPeriod = getPeriod(pCurrent);
    for (const pEvent of pEvents) {
      if (pVisited.has(pEvent.id)) continue;
      if (pEvent.type !== pRefEvent.type) continue;
      const pEventPeriod = getPeriod(pEvent);
      if (pCurrentPeriod.from <= pEventPeriod.to && pEventPeriod.from <= pCurrentPeriod.to) {
        pVisited.add(pEvent.id);
        pQueue.push(pEvent);
        pResult.push(pEvent);
      }
    }
  }
  return pResult;
}

/**
 * Sorts events by start time ascending, then (for ties) by end time descending, so a
 * longer event beginning at the same time as a shorter one is listed first.
 *
 * Note: sorts `pEvents` in place (`Array.prototype.sort`) and returns the same array.
 */
export function sortEventsByStartAscAndEndDesc(pEvents) {
  pEvents.sort((a, b) => {
    const startA = new Date(`${a.period.from.date}T${a.period.from.time}`);
    const startB = new Date(`${b.period.from.date}T${b.period.from.time}`);
    if (startA < startB) return -1;
    if (startA > startB) return 1;
    const endA = a.period.to && a.period.to.date ? new Date(`${a.period.to.date}T${a.period.to.time || a.period.from.time}`) : startA;
    const endB = b.period.to && b.period.to.date ? new Date(`${b.period.to.date}T${b.period.to.time || b.period.from.time}`) : startB;
    if (endA > endB) return -1;
    if (endA < endB) return 1;
    return 0;
  });
  return pEvents;
}

/**
 * Normalizes an event's period into a pair of sortable/comparable `"YYYY-MM-DDTHH:MM"`
 * strings, honoring `attributs.isFullDay` (00:00-23:59) and falling back to the start
 * date/time when `period.to` is missing.
 */
export function getEventTimeRange(pEvent) {
  const fromDate = pEvent.period.from.date;
  const fromTime = pEvent.attributs?.isFullDay ? "00:00" : (pEvent.period.from.time || "00:00");
  const toDate = pEvent.period.to?.date || fromDate;
  const toTime = pEvent.attributs?.isFullDay
    ? "23:59"
    : (pEvent.period.to?.time || fromTime);

  return {
    from: `${fromDate}T${fromTime}`,
    to: `${toDate}T${toTime}`
  };
}

/**
 * Finds the first event in `pEvents` (excluding soft-deleted ones and `pRefEvent`
 * itself) whose time range overlaps `pRefEvent`'s. Used to enforce "Darf nicht
 * überschneiden" (must not overlap) when saving an event (see `AddEventDialog`).
 *
 * @returns {Object|null} The conflicting event, or `null` if there is none.
 */
export function findOverlappingEvent(pRefEvent, pEvents) {
  const refRange = getEventTimeRange(pRefEvent);

  return pEvents.find(event => {
    if (event.id === pRefEvent.id) return false;
    if (event.deleteMarked) return false;

    const range = getEventTimeRange(event);
    return refRange.from <= range.to && range.from <= refRange.to;
  }) || null;
}

/**
 * Picks the chip color for an event, in priority order: soft-deleted (warning red) >
 * still-unsaved draft (`isNewEvent`, white) > "Veranstaltung" (event, green) >
 * "Programmpunkt" audience (`begleiter`/`teilnehmer`/both/neither).
 */
export function getEventColor(pEvent) {
  let color = "#4E749D";
  const colors = {
    begleiter:    "#9D4D4D",
    teilnehmer:   "#4E749D",
    beide:        "#735C9D", 
    event:        "#6D9D4D",
    pause:        "#ddddd",
    isNew:        "#ffffff",
    deleteMarker: "#8d1212"
  };

  if (pEvent.deleteMarked) {
    color = colors.deleteMarker;
  }
  else if (pEvent.attributs.isNewEvent) {
    color = colors.isNew;
  }
  else if (pEvent.type == "event") {
    color = colors.event;
  }
  else {
    if (pEvent.attributs.teilnehmer && pEvent.attributs.begleiter) {
      color = colors.beide;
    }else if (pEvent.attributs.teilnehmer) {
      color = colors.teilnehmer; 
    }else if (pEvent.attributs.begleiter) {
      color = colors.begleiter;
    }
  }

  return color;
}