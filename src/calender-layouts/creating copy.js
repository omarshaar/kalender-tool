import { calculateDateDifference, changeDateByDays, getWeekDayNumberWeekStartMonday } from "../ultis/dates";

export function createMonthChipData(pEvent, pType, pDatesRange, callBack) {
    const { dateFrom, dateTo, weekDay, startType, long, rowCount } = calculateValues(pType, pEvent, pDatesRange)

    if (pEvent.id == "G49zel2akJtwclv") {
        console.log(dateFrom, dateTo, weekDay, startType, long, rowCount);
    }

    if (rowCount == 1) {
        const curentLong = calculateDateDifference(dateFrom, dateTo) + 1;
        callBack(startType, dateFrom, curentLong * 100);
    }else {
        let restDays = long;
        for (let index = 0; index < rowCount; index++) {
            if (pEvent.id == "G49zel2akJtwclv") {
                console.count("repeat");
            }
            if (index == 0) {
                const curentLong = (7-weekDay)+1;
                const type = pType?.startsWith("prev") ? "end-end" : "start-end" ;
                restDays -= curentLong;
                callBack(type, dateFrom, curentLong * 100);
            }else {
                const curentLong = restDays > 7 ? 7 : restDays;
                const type = restDays > 7 ? "end-end" : pType?.endsWith("next") ? "end-end" : "end-start";
                // const fromDate = changeDateByDays(dateFrom, long - restDays + ((index == (rowCount - 1) && rowCount >= 6) ? 1 : 0));
                const fromDate = changeDateByDays(dateFrom, long - restDays);
                restDays -= curentLong;
                callBack(type, fromDate, curentLong * 100);
            }
        }
    }
}

function calculateValues(pType, pEvent, pDatesRange) {
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

function currentEvents(pEvent, pType, pDatesRange, callBack) {
    const long     = calculateDateDifference(pEvent.period.from.date, pEvent.period.to.date)+1;
    const weekDay  = getWeekDayNumberWeekStartMonday(pEvent.period.from.date);
    const rowCount = Math.ceil((weekDay + long) / 7);

    if (rowCount == 1) {
        // start-start
        const curentLong = calculateDateDifference(pEvent.period.from.date, pEvent.period.to.date) + 1;
        callBack("start-start", pEvent.period.from.date, curentLong * 100);
    }else {
        // start-end || end-end
        let restDays = long; 
        for (let index = 0; index < rowCount; index++) {
            if (index == 0) {
                const curentLong = (7-weekDay)+1;
                const type = "start-end";
                restDays -= curentLong;
                callBack(type, pEvent.period.from.date, curentLong * 100);
            }else {
                const curentLong = restDays >= 7 ? restDays - 7 : restDays;
                const type = restDays >= 7 ? "end-end" : "end-start";
                const fromDate =  changeDateByDays(pEvent.period.from.date, long-restDays);
                restDays -= curentLong;
                callBack(type, fromDate, curentLong * 100);
            }
        }
    }
}
