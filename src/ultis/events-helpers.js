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

export function filterEventsByPeriod_(pEvents, pRefEvent) {
    const pFromDateTime = new Date(`${pRefEvent.period.from.date}T${pRefEvent.period.from.time}`);
    const pToDate = pRefEvent.period.to && pRefEvent.period.to.date ? pRefEvent.period.to.date : pRefEvent.period.from.date;
    const pToTime = pRefEvent.period.to && pRefEvent.period.to.time ? pRefEvent.period.to.time : (() => {
      const dt = new Date(`${pRefEvent.period.from.date}T${pRefEvent.period.from.time}`);
      dt.setMinutes(dt.getMinutes() + 30);
      return dt.toTimeString().slice(0, 5);
    })();
    const pToDateTime = new Date(`${pToDate}T${pToTime}`);
    return pEvents.filter(pEvent => {
      if (pEvent.id === pRefEvent.id) return false;
      if (pEvent.type !== pRefEvent.type) return false;
      const pEventFrom = new Date(`${pEvent.period.from.date}T${pEvent.period.from.time}`);
      const pEventToDate = pEvent.period.to && pEvent.period.to.date ? pEvent.period.to.date : pEvent.period.from.date;
      const pEventToTime = pEvent.period.to && pEvent.period.to.time ? pEvent.period.to.time : (() => {
        const dt = new Date(`${pEvent.period.from.date}T${pEvent.period.from.time}`);
        dt.setMinutes(dt.getMinutes() + 30);
        return dt.toTimeString().slice(0, 5);
      })();
      const pEventTo = new Date(`${pEventToDate}T${pEventToTime}`);
      return pEventFrom <= pToDateTime && pFromDateTime <= pEventTo;
    });
}

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