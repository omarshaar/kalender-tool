/**
 * @file Chip-splitting geometry for multi-day events in the month layout.
 *
 * The month grid is a 7-column table where a multi-day event may span several rows
 * (one row per week). This module turns one event's period into the list of
 * per-row "chip" segments needed to render that span correctly, each with its own
 * start/end style (whether the segment starts/ends exactly on the event's real
 * start/end date, or is just continuing off-screen into a previous/next row).
 *
 * `pType` describes where the event's period sits relative to the currently visible
 * date range (`pDatesRange`):
 * - `"current"`      - both start and end dates are inside the visible range.
 * - `"prev"`         - the event started before the visible range and ends inside it.
 * - `"next"`         - the event starts inside the visible range and ends after it.
 * - `"current-next"` - same as `"next"`, kept as a distinct case for `startType`.
 * - `"between"`      - the event spans the entire visible range (started before, ends after).
 */

import { calculateDateDifference, changeDateByDays, getWeekDayNumberWeekStartMonday } from "../ultis/dates";

/**
 * Splits one event's period into per-row chip segments and reports each one via `callBack`.
 *
 * @param {Object} pEvent - The event being rendered (uses `pEvent.period.from/to.date`).
 * @param {"current"|"prev"|"next"|"current-next"|"between"} pType - Where the event's
 *   period sits relative to `pDatesRange` (see file header).
 * @param {string[]} pDatesRange - The dates currently visible in the month grid, in order.
 * @param {(type: string, dateStart: string, width: number, emptysLong: number) => void} callBack -
 *   Invoked once per row segment with:
 *     - `type` - a `"<start>-<end>"` style key (e.g. `"start-end"`, `"end-end"`) describing
 *       whether this segment's edges are the event's real start/end or just a row break.
 *     - `dateStart` - the date this segment visually starts on.
 *     - `width` - the segment's width as `daysInSegment * 100` (percent of one day-cell).
 *     - `emptysLong` - `daysInSegment - 1`, i.e. how many extra day-cells this chip covers.
 */
export function createMonthChipData(pEvent, pType, pDatesRange, callBack) {
    const { dateFrom, dateTo, weekDay, startType, long, rowCount } = calculateValues(pType, pEvent, pDatesRange)

    if (rowCount == 1) {
        const curentLong = calculateDateDifference(dateFrom, dateTo) + 1;
        callBack(startType, dateFrom, curentLong * 100, curentLong-1);
    }else {
        let restDays = long;
        for (let index = 0; index < rowCount; index++) {
            if (index == 0) {
                const curentLong = (7-weekDay)+1;
                const type = (pType?.startsWith("prev") || pType == "between" ) ? "end-end" : "start-end" ;
                restDays -= curentLong;
                callBack(type, dateFrom, curentLong * 100, curentLong-1);
            }else {
                const curentLong = restDays > 7 ? 7 : restDays;
                const type = restDays > 7 ? "end-end" : ( pType?.endsWith("next") || pType == "between" ) ? "end-end" : "end-start";
                const fromDate = changeDateByDays(dateFrom, long - restDays);
                restDays -= curentLong;
                callBack(type, fromDate, curentLong * 100, curentLong-1);
            }
        }
    }
}

/**
 * Resolves the effective start/end dates for an event given how it relates to the
 * visible date range (see `pType` in the file header), and derives the grid geometry
 * needed to split it into rows: which weekday it starts on, its total length in days,
 * and how many grid rows it spans.
 *
 * @param {"current"|"prev"|"next"|"current-next"|"between"} pType
 * @param {Object} pEvent - The event being rendered.
 * @param {string[]} pDatesRange - The dates currently visible in the month grid, in order.
 * @returns {{
 *   dateFrom: string,
 *   dateTo: string,
 *   weekDay: number,
 *   startType: string,
 *   long: number,
 *   rowCount: number
 * }} `weekDay` is 1 (Monday) through 7 (Sunday); `long` is the span length in days;
 *   `rowCount` is how many grid rows (weeks) the span covers.
 */
export function calculateValues(pType, pEvent, pDatesRange) {
    let dateFrom, dateTo, long, weekDay, rowCount, startType;

    if (pType == "current") {
        dateFrom   = pEvent.period.from.date;
        dateTo     = pEvent.period.to.date;
        startType  = "start-start";
    } else if (pType == "prev") {
        dateFrom   = pDatesRange[0];
        dateTo     = pEvent.period.to.date;
        startType  = "end-start";
    } else if (pType == "next") {
        dateFrom   = pEvent.period.from.date;
        dateTo     = pDatesRange[pDatesRange.length-1];
        startType  = "start-end";
    } else if (pType == "current-next") {
        dateFrom   = pEvent.period.from.date;
        dateTo     = pDatesRange[pDatesRange.length-1];
        startType  = "start-end";
    } else if (pType == "between") {
        dateFrom   = pDatesRange[0];
        dateTo     = pDatesRange[pDatesRange.length-1];
        startType  = "end-end";
    }

    weekDay    = getWeekDayNumberWeekStartMonday(dateFrom);
    long     = calculateDateDifference(dateFrom, dateTo)+1;
    rowCount = Math.ceil(((weekDay + long) - 1) / 7);

    return {
        dateFrom,
        dateTo,
        weekDay,
        startType,
        long,
        rowCount
    }
}
