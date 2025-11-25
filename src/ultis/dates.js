/**
 * This module provides utility functions for date and time manipulation.
 * 
 * 2.0.0        2024-08-25  Omar Shaar
 *              - Secound implementation
 */


/**
 * Returns the current date in the format "YYYY-MM-DD".
 *
 * @returns {string} The current date in the format "YYYY-MM-DD".
 */
export function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns the date in the format "YYYY-MM-DD".
 *
 * @returns {string} The current date in the format "YYYY-MM-DD".
 */
export function formatDate(pDateValue) {
    const selectedDate = new Date(pDateValue);

    const year = selectedDate.getFullYear();
    const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
    const day = ('0' + selectedDate.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

/**
 * Returns the current time in the format "HH:MM".
 *
 * @returns {string} The current time in the format "HH:MM".
 */
export function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Calculates the time difference in hours between two given times.
 *
 * @param {string} pStartTime - The start time in the format "HH:MM".
 * @param {string} pEndTime - The end time in the format "HH:MM".
 * @returns {number} The difference in hours between the start and end times.
 */
export function calculateTimeDifferenceInHours(pStartTime, pEndTime) {
    /**
     * Converts a time string in the format "HH:MM" to the total number of minutes since midnight.
     *
     * @param {string} time - The time string to convert.
     * @returns {number} The total number of minutes since midnight.
     */
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    const startMinutes = timeToMinutes(pStartTime);
    const endMinutes = timeToMinutes(pEndTime);

    // Calculate the difference in minutes
    let differenceInMinutes = endMinutes - startMinutes;

    // Ensure the difference is not negative (if the end time is on the next day)
    if (differenceInMinutes < 0) {
        differenceInMinutes += 1440; // 1440 is the number of minutes in one day
    }

    // Convert the difference in minutes to hours
    const differenceInHours = differenceInMinutes / 60;

    return differenceInHours;
}

/**
 * Normalizes two given times by converting them to minutes since midnight,
 * and then returns the times in "HH:MM" format with the smaller time as timeStart
 * and the larger time as timeEnd.
 *
 * @param {string} pTime1 - The first time string in the format "HH:MM".
 * @param {string} pTime2 - The second time string in the format "HH:MM".
 * @returns {Object} An object containing the normalized times with properties:
 *                   - timeStart: The earlier time in "HH:MM" format.
 *                   - timeEnd: The later time in "HH:MM" format.
 */
export function normalizeTimes(pTime1, pTime2) {
    /**
     * Converts a time string in the format "HH:MM" to the total number of minutes since midnight.
     *
     * @param {string} time - The time string to convert.
     * @returns {number} The total number of minutes since midnight.
     */
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Convert the times to minutes since midnight
    const minutes1 = timeToMinutes(pTime1);
    const minutes2 = timeToMinutes(pTime2);

    // Determine the smaller and larger time in minutes
    const startTime = Math.min(minutes1, minutes2);
    const endTime = Math.max(minutes1, minutes2);

    /**
     * Converts a total number of minutes since midnight to a time string in the format "HH:MM".
     *
     * @param {number} minutes - The total number of minutes since midnight.
     * @returns {string} The time string in the format "HH:MM".
     */
    function minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    return {
        timeStart: minutesToTime(startTime),
        timeEnd: minutesToTime(endTime)
    };
}

/**
 * Converts a given date to a readable format in the format "DD Month YYYY".
 *
 * @param {string|number|Date} pInputDate - The date to convert. It can be a string, number, or Date object.
 * @returns {string} The converted date in the format "DD Month YYYY".
 */
export function convertDateToReadableFormat(pInputDate, pLayout) {
    const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    const date   = new Date(pInputDate);
    const day    = String(date.getDate()).padStart(2, '0');
    const month  = months[date.getMonth()];
    const year   = date.getFullYear();
    
    if (pLayout == "month-layout") {
        return `${month} ${year}`;
    } else {
        return `${day} ${month} ${year}`;
    }
}

/**
 * Changes the given date by a specified number of days.
 *
 * @param {string} pDateStr - The date string in the format "YYYY-MM-DD".
 * @param {number} pDays - The number of days to add (positive) or subtract (negative) from the given date.
 * @returns {string} The new date string in the format "YYYY-MM-DD" after adding/subtracting the specified number of days.
 */
export function changeDateByDays(pDateStr, pDays) {
    const parts = pDateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + pDays);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
  

/**
 * Changes the given date by a specified number of months.
 *
 * @param {string} pDateStr - The date string in the format "YYYY-MM-DD".
 * @param {number} pMonths - The number of months to add (positive) or subtract (negative) from the given date.
 * @returns {string} The new date string in the format "YYYY-MM-DD" after adding/subtracting the specified number of months.
 */
export function changeDateByMonths(pDateStr, pMonths) {
    let date = new Date(pDateStr);
    date.setMonth(date.getMonth() + pMonths);
    let newDateStr = date.toISOString().split('T')[0];
    return newDateStr;
}

/**
 * Converts a decimal time value to a formatted time string in the format "HH:MM".
 *
 * @param {number} PDecimalTime - The decimal time value to convert. The integer part represents hours,
 *                                and the fractional part represents minutes.
 * @returns {string} The formatted time string in the format "HH:MM".
 */
export function convertDecimalTimeToFormatedTime(PDecimalTime) {
    var hours = Math.floor(PDecimalTime);
    var minutes = Math.round((PDecimalTime - hours) * 60);

    var timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return timeFormatted;
}


/**
 * Adds a specified number of hours to a given time.
 *
 * @param {string} PTime - The initial time in the format "HH:MM".
 * @param {number} pHoursToAdd - The number of hours to add to the initial time.
 * @returns {string} The new time in the format "HH:MM" after adding the specified number of hours.
 */
export function addDecimalTimeToFormatedTime(PTime, pHoursToAdd) {
    // Parse the input time
    let [hours, minutes] = PTime.split(':').map(Number);

    // Calculate the total minutes to add
    let totalMinutesToAdd = Math.round(pHoursToAdd * 60);

    const timeInMinutes = hours * 60 + minutes;

    let timeInHoure = ((totalMinutesToAdd + timeInMinutes) / 60);

    if (pHoursToAdd > 0 && timeInHoure > 24) {
        timeInHoure = timeInHoure - 24;
    }

    if (pHoursToAdd < 0 && timeInHoure < 0) {
        timeInHoure = timeInHoure + 24;
    }

    return convertDecimalTimeToFormatedTime(timeInHoure);
}

/**
 * Compares two time strings in the format "HH:MM" and returns the greater time.
 *
 * @param {string} pTargetTime - The first time string in the format "HH:MM".
 * @param {string} pTime2 - The second time string in the format "HH:MM".
 * @returns {string|boolean} The greater time string in the format "HH:MM", or false if both times are equal.
 */
export function isGreaterTime(pTargetTime, pTime2) {
    var date1 = new Date("2000-01-01T" + pTargetTime + ":00");
    var date2 = new Date("2000-01-01T" + pTime2 + ":00");

    if (date1 > date2) {
        return pTargetTime;
    } else {
        return false;
    }
}

/**
 * Compares two time strings in the format "HH:MM" and returns the smaller time.
 *
 * @param {string} pTargetTime - The first time string in the format "HH:MM".
 * @param {string} pTime2 - The second time string in the format "HH:MM".
 * @returns {string|boolean} The smaller time string in the format "HH:MM", or false if both times are equal.
 */
export function isSmallerTime(pTargetTime, pTime2) {
    var date1 = new Date("2000-01-01T" + pTargetTime + ":00");
    var date2 = new Date("2000-01-01T" + pTime2 + ":00");

    if (date1 < date2) {
        return pTargetTime;
    } else {
        return false;
    }
}

/**
 * Checks if a target time is between a start time and an end time.
 *
 * @param {Object} pTargetTime - The target time to check.
 * @param {string} pTargetTime.date - The date of the target time in the format "YYYY-MM-DD".
 * @param {string} pTargetTime.time - The time of the target time in the format "HH:MM".
 * @param {Object} pStartTime - The start time.
 * @param {string} pStartTime.date - The date of the start time in the format "YYYY-MM-DD".
 * @param {string} pStartTime.time - The time of the start time in the format "HH:MM".
 * @param {Object} pEndTime - The end time.
 * @param {string} pEndTime.date - The date of the end time in the format "YYYY-MM-DD".
 * @param {string} pEndTime.time - The time of the end time in the format "HH:MM".
 * @returns {boolean} True if the target time is between the start and end times, otherwise false.
 */
export function isBetween2Dates(pTargetTime, pStartTime, pEndTime) {
    var targetDate = new Date(pTargetTime.date + "T" + pTargetTime.time + ":00");
    var startDate  = new Date(pStartTime.date + "T" + pStartTime.time + ":00");
    var endDate    = new Date(pEndTime.date + "T" + pEndTime.time + ":00");

    if (targetDate >= startDate && targetDate <= endDate) {
        return true;
    } else {
        return false;
    }
}

/**
 * Calculates the difference in minutes between two given times.
 * 
 * @param {string} pTime1 - The first time string in the format "HH:MM".
 * @param {string} pTime2 - The second time string in the format "HH:MM".
 * @returns {number} The difference in minutes between the first and second times.
 */
export function getDiffInMin(pTime1, pTime2) {
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    const time1 = timeToMinutes(pTime1);
    const time2 = timeToMinutes(pTime2);

    return time1 - time2;
}

/**
 * Returns the day name and day of the month for a given date string.
 *
 * @param {string} pDateStr - The date string in the format "YYYY-MM-DD".
 * @returns {string} A formatted string containing the day name and day of the month.
 */
export function getDayNameAndMonthDay(pDateStr, showMonth) {
    const [year, month, day] = pDateStr.split('-').map(Number);

    const date = new Date(year, month - 1, day);

    // const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    const dayName = days[date.getDay()];

    const dayOfMonth = date.getDate();

    return (
        <>
          <span style={{ marginInlineEnd: "4px" }}>{dayName}</span>
          {dayOfMonth}{showMonth ? "/" + month : ""}
        </>
    );      
}

/**
 * Returns a formatted string containing the day of the month and the day name for a given date string.
 *
 * @param {string} pDateStr - The date string in the format "YYYY-MM-DD".
 * @returns {string} A formatted string containing the day of the month and the day name.
 */
export function getDayNameAndMonthDayMonthLayout(pDateStr) {
    const [year, month, day] = pDateStr.split('-').map(Number);

    const date = new Date(year, month - 1, day);

    // const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    const dayName = days[date.getDay()];

    const dayOfMonth = date.getDate();

    return `<span>${dayOfMonth}</span> <span class="calender-header-week-day">${dayName}</span>`;
}

/**
 * Returns the day of the week as a number for a given date string.
 *
 * @param {string} pDateStr - The date string in the format "YYYY-MM-DD".
 * @returns {number} The day of the week as a number (1 for Sunday, 2 for Monday, ..., 7 for Saturday).
 */
export function getWeekDayNumber(pDateStr) {
    const date = new Date(pDateStr);
    return (date.getDay() + 1);
}

/**
 * Returns the number of days in the month of the given date string.
 *
 * @param {string} pDateString - The date string in the format "YYYY-MM-DD".
 * @returns {number} The number of days in the month of the given date.
 */
export function getDaysInMonth(pDateString) {
    let date = new Date(pDateString);
    
    let year = date.getFullYear();
    let month = date.getMonth() + 1; 

    let nextMonth = new Date(year, month, 0);
    
    return nextMonth.getDate();
}

/**
 * Removes the day component from a date string in the format "YYYY-MM-DD".
 *
 * @param {string} pDateString - The date string in the format "YYYY-MM-DD".
 * @returns {string} The date string in the format "YYYY-MM" after removing the day component.
 */
export function removeDayFromStrDate(pDateString) {
    if (!pDateString) {
        return;
    }
    
    let parts = pDateString.split("-");

    let year = parts[0];
    let month = parts[1];
    
    return `${year}-${month}`;
}

/**
 * Calculates the number of days between two given dates.
 *
 * @param {string} pStartDate - The start date in the format "YYYY-MM-DD".
 * @param {string} pEndDate - The end date in the format "YYYY-MM-DD".
 * @returns {number} The number of days between the start and end dates.
 */
export function calculateDaysBetweenDates(pStartDate, pEndDate) {
    const startDate = new Date(pStartDate);
    const endDate   = new Date(pEndDate);

    const timeDifference = endDate - startDate;

    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    return Math.floor(daysDifference);
}

/**
 * Checks if a target date falls between two given dates (inclusive).
 * The comparison is done on the first day of each month.
 *
 * @param {string} targetDate - The target date to check in the format "YYYY-MM".
 * @param {string} date1 - The start date in the format "YYYY-MM".
 * @param {string} date2 - The end date in the format "YYYY-MM".
 *
 * @returns {boolean} True if the target date falls between the start and end dates,
 *                    otherwise false.
 */
export function isDateMonthBetween(targetDate, date1, date2) {
    let target = new Date(targetDate + '-01');
    let d1 = new Date(date1 + '-01');
    let d2 = new Date(date2 + '-01');
    
    let startDate = d1 < d2 ? d1 : d2;
    let endDate = d1 > d2 ? d1 : d2;
    
    return target > startDate && target < endDate;
}

/**
 * Extracts the day component from a date string in the format "YYYY-MM-DD".
 *
 * @param {string} dateString - The date string in the format "YYYY-MM-DD".
 * @returns {string} The day component of the date string.
 */
export function getDayFromDate(dateString) {
    const parts = dateString.split("-");
    return parts[2];
}

/**
 * Calculates the difference in days between two given dates.
 *
 * @param {string} date1 - The first date in the format "YYYY-MM-DD".
 * @param {string} date2 - The second date in the format "YYYY-MM-DD".
 *
 * @returns {number} The difference in days between the two dates.
 *                   The result is a positive number if date2 is later than date1,
 *                   and a negative number if date2 is earlier than date1.
 */
export function calculateDateDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const differenceInTime = d2.getTime() - d1.getTime();

    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    return differenceInDays;
}

/**
 * Modifies a given date by adding a specified number of days.
 *
 * @param {string} initialDate - The initial date in the format "YYYY-MM-DD".
 * @param {number} daysDifference - The number of days to add to the initial date.
 *
 * @returns {string} The modified date in the format "YYYY-MM-DD".
 *                   The returned date is calculated by adding the specified number of days to the initial date.
 */
export function modifyDateByDays(initialDate, daysDifference) {
    const date = new Date(initialDate);
    date.setDate(date.getDate() + daysDifference);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function generateDateRange(pStartDate, pEndDate) {
    const startDate = new Date(pStartDate);
    const endDate = new Date(pEndDate);
    const dateArray = [];

    let currentDate = startDate;

    while (currentDate <= endDate) {
        dateArray.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
}

export function generateDateRangeWithoutEmptys_(pEvents, pDateRange) {

    const dateToObj = (dateStr) => new Date(dateStr);
    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0]; 
    };

    let events = pEvents.filter(event => event.eventID != "0");

    let eventDateRanges = events.map(event => {
        const startDate = dateToObj(event.startDate);
        const endDate = event.endDate ? dateToObj(event.endDate) : startDate;
        return { startDate, endDate };
    });

    let filteredDates = pDateRange.filter(dateStr => {
        const currentDate = dateToObj(dateStr);
        return eventDateRanges.some(range => currentDate >= range.startDate && currentDate <= range.endDate);
    });
    
    if (filteredDates.length > 0) {
        const firstDate = filteredDates[0];
        const lastDate = filteredDates[filteredDates.length - 1];
        
        filteredDates.unshift(addDays(firstDate, -1));
        
        filteredDates.push(addDays(lastDate, 1));
    }
    
    let events2 = pEvents.filter(event => event.eventID == "0");

    events2.forEach(event => {
        if (!filteredDates.includes(event.startDate)) {
            filteredDates.push(event.startDate);
        }

        if (!filteredDates.includes(event.endDate)) {
            filteredDates.push(event.endDate);
        }
    });

    filteredDates.sort((a, b) => new Date(a) - new Date(b));

    return filteredDates;
}

export function generateDateRangeWithoutEmptys(pEvents) {
    let events = pEvents.filter(event => event.eventID != "0");
    const dateSet = new Set();

    events.forEach(event => {
        const startDate = new Date(event.period.from.date);
        const endDate = new Date(event.period.to.date);

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            dateSet.add(date.toISOString().split('T')[0]);
        }
    });

    const range = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
    return range;
}

export function calculateEmptyDays_(events) {
    function parseDate(dateStr) {
        return new Date(dateStr);
    }

    const veranstaltungen = events.filter(event => event.eventID === '0');
    const programPunkte = events.filter(event => event.eventID !== '0');
    const result = [];

    veranstaltungen.forEach(veranstaltung => {
        const startDateV = parseDate(veranstaltung.startDate);
        const endDateV = parseDate(veranstaltung.endDate);
        let totalDays = (endDateV - startDateV) / (1000 * 60 * 60 * 24) + 1; 
        let emptyDays = totalDays;

        programPunkte.forEach(punkt => {
            if (punkt.eventID === veranstaltung.id) {
                const startDateP = parseDate(punkt.startDate);
                const endDateP = parseDate(punkt.endDate);
                
                const overlapStart = new Date(Math.max(startDateV, startDateP));
                const overlapEnd = new Date(Math.min(endDateV, endDateP));

                if (overlapStart <= overlapEnd) {
                    const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
                    emptyDays -= overlapDays;
                }
            }
        });

        result.push({
            VeranstaltungID: veranstaltung.id,
            emptyDays: emptyDays
        });
    });

    return result;
}

export function calculateEmptyDays(events) {
    function parseDate(dateStr) {
        return new Date(dateStr);
    }

    const veranstaltungen = events.filter(event => event.eventID === '0');
    const programPunkte = events.filter(event => event.eventID !== '0');
    const result = [];

    veranstaltungen.forEach(veranstaltung => {
        const startDateV = parseDate(veranstaltung.startDate);
        const endDateV = parseDate(veranstaltung.endDate);
        let totalDays = (endDateV - startDateV) / (1000 * 60 * 60 * 24) + 1;
        let emptyDays = totalDays;
        let reduceStartDay = true;
        let reduceEndDay = true;

        programPunkte.forEach(punkt => {
            if (punkt.eventID === veranstaltung.id) {
                const startDateP = parseDate(punkt.startDate);
                const endDateP = parseDate(punkt.endDate);
                
                const overlapStart = new Date(Math.max(startDateV, startDateP));
                const overlapEnd = new Date(Math.min(endDateV, endDateP));

                if (overlapStart <= overlapEnd) {
                    const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
                    emptyDays -= overlapDays;

                    if (overlapStart <= startDateV && overlapEnd >= startDateV) {
                        reduceStartDay = false;
                    }

                    if (overlapStart <= endDateV && overlapEnd >= endDateV) {
                        reduceEndDay = false;
                    }
                }
            }
        });

        if (reduceStartDay) emptyDays -= 1;
        if (reduceEndDay) emptyDays -= 1;

        result.push({
            VeranstaltungID: veranstaltung.id,
            emptyDays: emptyDays
        });
    });

    return result;
}



/**
 * Calculates the start and end dates of the week that contains a given date.
 *
 * @param {string} pDateString - The date for which to calculate the week start and end.
 *                               The date should be in the format "YYYY-MM-DD".
 *
 * @returns {Object} An object containing the start and end dates of the week.
 * @returns {Object.start} start - The start date of the week in the format "YYYY-MM-DD".
 * @returns {Object.end} end - The end date of the week in the format "YYYY-MM-DD".
 *                             The week starts on Monday and ends on Sunday.
 */
export function getWeekStartAndEnd(pDateString) {
    const date = new Date(pDateString);

    const day = date.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day; 
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d) => d.toISOString().split('T')[0];

    return {
        start: formatDate(monday),
        end: formatDate(sunday)
    };
}


/**
 * Adjusts the start and end dates by adding a specified number of minutes to each date.
 *
 * @param {string} startDate - The start date in the format "YYYY-MM-DD".
 * @param {string} startTime - The start time in the format "HH:MM".
 * @param {string} endDate - The end date in the format "YYYY-MM-DD".
 * @param {string} endTime - The end time in the format "HH:MM".
 * @param {number} minutes - The number of minutes to add to each date.
 *
 * @returns {Object} An object containing the adjusted start and end date-time.
 * @returns {Object.date} newStartDate - The adjusted start date in the format "YYYY-MM-DD".
 * @returns {Object.time} newStartDate.time - The adjusted start time in the format "HH:MM".
 * @returns {Object.date} newEndDate - The adjusted end date in the format "YYYY-MM-DD".
 * @returns {Object.time} newEndDate.time - The adjusted end time in the format "HH:MM".
 */
export function adjustDates(startDate, startTime, endDate, endTime, minutes) {
    // Function to parse date and time into a Date object
    function parseDateTime(dateStr, timeStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
    }

    // Function to format Date object back to date and time strings
    function formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return {date: `${year}-${month}-${day}`, time: `${hours}:${minutes}`};
    }

    // Parse the start and end dates with times
    const startDateTime = parseDateTime(startDate, startTime);
    const endDateTime = parseDateTime(endDate, endTime);

    // Add the specified minutes to each date
    startDateTime.setMinutes(startDateTime.getMinutes() + minutes);
    endDateTime.setMinutes(endDateTime.getMinutes() + minutes);

    // Format the new dates back to strings
    const newStartDate = formatDateTime(startDateTime);
    const newEndDate = formatDateTime(endDateTime);
    
    // Return the adjusted start and end date-time
    return {
        newStartDate,
        newEndDate
    };
}

/**
 * Calculates the overlapping dates between two given date ranges.
 *
 * @param {string} event1Start - The start date of the first event in the format "YYYY-MM-DD".
 * @param {string} event1End - The end date of the first event in the format "YYYY-MM-DD".
 * @param {string} event2Start - The start date of the second event in the format "YYYY-MM-DD".
 * @param {string} event2End - The end date of the second event in the format "YYYY-MM-DD".
 *
 * @returns {Array} An array of dates that represent the overlapping dates between the two events.
 *                  Each date is in the format "YYYY-MM-DD".
 *                  If there are no overlapping dates, an empty array is returned.
 */
export function getOverlappingDates(event1Start, event1End, event2Start, event2End) {
    let start1 = new Date(event1Start);
    let end1 = new Date(event1End);
    let start2 = new Date(event2Start);
    let end2 = new Date(event2End);

    let overlapStart = new Date(Math.max(start1, start2));
    let overlapEnd = new Date(Math.min(end1, end2));

    if (overlapStart > overlapEnd) {
        return [];
    }

    let overlappingDates = [];
    let currentDate = new Date(overlapStart);

    while (currentDate <= overlapEnd) {
        overlappingDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return overlappingDates;
}


export function roundTimeToNearest(pInputTime, pTargetMinutes) {
    let [inputHours, inputMinutes] = pInputTime.split(":").map(Number);
    let totalMinutes = inputHours * 60 + inputMinutes;
    let roundedMinutes = Math.round(totalMinutes / pTargetMinutes) * pTargetMinutes;

    let newHours = Math.floor(roundedMinutes / 60);
    let newMinutes = roundedMinutes % 60;

    newHours = newHours.toString().padStart(2, "0");
    newMinutes = newMinutes.toString().padStart(2, "0");

    return `${newHours}:${newMinutes}`;
}

















/**
 * ----------------------------------------------------------------
 * 
 * [ Ab dem ReactJS Project ]
 * 03.03.2025 Omar shaar
 * Kalender Tool @GLAMUS
 * React Version 1
 * 
 * ----------------------------------------------------------------
 */

export function generateDatesRangeMonthLayout(pDateString, pPrevDays, pNextDays) {
    let result = [];
    let targetDate = new Date(pDateString);
    let year = targetDate.getFullYear();
    let month = targetDate.getMonth();

    let prevMonth = new Date(year, month, 0);
    for (let i = pPrevDays - 1; i >= 0; i--) {
        let date = new Date(prevMonth);
        date.setDate(prevMonth.getDate() - i);
        result.push(formatDate(date));
    }

    let currentMonth = new Date(year, month, 1);
    while (currentMonth.getMonth() === month) {
        result.push(formatDate(currentMonth));
        currentMonth.setDate(currentMonth.getDate() + 1);
    }
    
    let nextMonth = new Date(year, month + 1, 1);
    for (let i = 0; i < pNextDays; i++) {
        result.push(formatDate(nextMonth));
        nextMonth.setDate(nextMonth.getDate() + 1);
    }
    
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    return result;
}

/**
 * Filters an array of events based on a given date.
 *
 * @param {Array} pEvents - An array of event objects. Each event object should have a 'period' property with 'from' and 'to' dates.
 * @param {string} pDate - The date to filter events by. The date should be in the format 'YYYY-MM-DD'.
 *
 * @returns {Array} - An array of events that intersect with the given date.
 */
export function filterByDate(pEvents, pDate, isEventType) {
    const targetDate = new Date(pDate);
    return pEvents.filter(event => {
        const startDate = new Date(event.period.from.date);
        const endDate   = new Date(event.period.to.date || event.period.from.date);
        // Check if the target date is the same as the start date, end date, or falls between them
        return (targetDate >= startDate && targetDate <= endDate) && ( isEventType ? event.type == "event" : event.type != "event");
    });
}

export function filterByDateAllTypes(pEvents, pDate, isEventType) {
    const targetDate = new Date(pDate);
    return pEvents.filter(event => {
        const startDate = new Date(event.period.from.date);
        const endDate   = new Date(event.period.to.date || event.period.from.date);
        // Check if the target date is the same as the start date, end date, or falls between them
        return (targetDate >= startDate && targetDate <= endDate);
    });
}

/**
 * Returns the day of the week as a number for a given date string,
 * where Monday is 1 and Sunday is 7.
 *
 * @param {string} pDateStr - The date string in the format "YYYY-MM-DD".
 * @returns {number} The day of the week as a number (1 for Monday, 2 for Tuesday, ..., 7 for Sunday).
 */
export function getWeekDayNumberWeekStartMonday(pDateStr) {
    const date = new Date(pDateStr);    
    const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Adjust so Monday is 1 and Sunday is 7
    return day === 0 ? 7 : day;
}

/**
 * Converts a given number of minutes into a formatted time string "HH:MM".
 *
 * @param {number} minutes - The total number of minutes to convert.
 * @returns {string} The formatted time string in the format "HH:MM".
 */
export function convertMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(remainingMinutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}

/**
 * Returns an array of events that intersect with a given date range.
 *
 * @param {Array} pEvents - Array of event objects. Each event should have a 'period' property with 'from' and 'to' dates.
 * @param {string} startDate - Start date in the format 'YYYY-MM-DD'.
 * @param {string} endDate - End date in the format 'YYYY-MM-DD'.
 * @returns {Array} - Array of events that overlap with the given date range.
 */
export function filterEventsBetweenDates(pEvents, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return pEvents.filter(event => {
        const eventStart = new Date(event.period.from.date);
        const eventEnd = new Date(event.period.to.date || event.period.from.date);
        return eventEnd >= start && eventStart <= end;
    });
}

/**
 * Returns an array of events that match a given event ID.
 *
 * @param {Array} pEvents - Array of event objects.
 * @param {string|number} eventId - The event ID to filter by.
 * @returns {Array} - Array of events with the specified event ID.
 */
export function filterEventsByEventId(pEvents, pEventId) {
    return pEvents.filter(event => event.targetEventId === pEventId || event.id === pEventId || event.attributs.isNewEvent);
}