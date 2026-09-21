/**
 * @file Month view of the calendar ("month-layout"): a 7-column grid of days for the
 * selected month, with multi-day events rendered as horizontal chips that can span
 * several day-cells and wrap across week rows.
 *
 * Unlike the day/period layouts, this view does not visually separate "Veranstaltung"
 * (event) from "Programmpunkt" (programm) — all active events for the month are shown
 * together in each day's chip row (see `getTargetEvents`/`createDateChips`).
 *
 * Dragging a chip moves the whole event by whole days (no time-of-day precision here);
 * see the "Event Moving Logiks" section below.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { MainContext } from "../context";
import { calculateDaysBetweenDates, changeDateByDays, filterByDateAllTypes, generateDateRange, generateDatesRangeMonthLayout, getCurrentTime, getDaysInMonth, getTodayDate, getWeekDayNumber } from "../ultis/dates";
import { EventsContext } from "../context/events";
import { MonthEventChip } from "../components";
import { Box } from "@mui/system";
import { filterEventsByMonth, getEventColor, sortEventsByStartAscAndEndDesc } from "../ultis/events-helpers";
import { generateRandomId } from "../ultis/global";
import { ClickAwayListener } from "@mui/material";

export default function CalenderMonthLayout(props) {
    const {state, setState} = useContext(MainContext);
    const {eventsState, setEventsState, changeEventListHandler} = useContext(EventsContext);
    const [calender, setCalender] = useState([<></>]);
    const [eventsContainer, setEventsContainer] = useState(<></>);
    /** All active events (saved + drafts), independent of the currently viewed month. */
    const [eventList, setEventList] = useState([]);
    /** Subset of `eventList` that actually falls within the currently viewed month. */
    const [currentEvents, setCurrentEvents] = useState([]);
    const [openShowMoreBox, setOpenShowMoreBox] = useState(false);
    const [showMoreDate, setShowMoreDate] = useState("");
    const CalenderMonthLayoutContainer = useRef();
    const visibleDatesRef = useRef([]);
    const eventsStateRef = useRef(eventsState);
    const dragRef = useRef(null);

    // Rebuild the grid whenever the viewed month or its events change.
    useEffect(()=> createMonthLayout(), [state.selectedDate, currentEvents]);
    // Re-derive `eventList` whenever the shared events store changes.
    useEffect(()=> { getTargetEvents(); },[eventsState]);
    // Narrow `eventList` down to the events relevant to the currently viewed month.
    useEffect(()=> { setCurrentEvents(filterEventsByMonth(eventList, state.selectedDate)); },[eventList, state.selectedDate]);
    useEffect(()=> { eventsStateRef.current = eventsState; }, [eventsState]);
    useEffect(() => () => {
        document.removeEventListener("mousemove", handleMonthPointerMove);
        document.removeEventListener("mouseup", handleMonthPointerUp);
    }, []);

    /**
     * Builds the month grid: leading/trailing inactive-day cells, one cell per day of
     * the selected month, and the event-chip overlay rendered on top of them.
     *
     * @param {string} [pDateStr] - Month to render as "YYYY-MM-DD" (any day in that
     *   month); defaults to `state.selectedDate`.
     */
    function createMonthLayout(pDateStr) {
        const calender           = [];
        let leerChipsDates       = [];
        const selectedDate       = pDateStr || state.selectedDate;
        const [year, month, day] = selectedDate.split('-').map(Number);
    
        let gMonthStartDay = getWeekDayNumber(`${year}-${month}-01`);
        let gMonthLength   = getDaysInMonth(selectedDate);
        let gInActiveDays  = gMonthStartDay == 1 ? 6 : gMonthStartDay - 2;
        let gSumOfCells    = gInActiveDays + gMonthLength;
        let gRowsAmount    = (Math.floor(gSumOfCells / 5)) - 1;
        let gRestDays      = (gRowsAmount * 7) - gSumOfCells; // 7 is the number of days in a week (cloumns)
        const dates        = generateDatesRangeMonthLayout(selectedDate,gInActiveDays ? gInActiveDays - 1 : gInActiveDays,gRestDays ? gRestDays + 1 : gRestDays);
        visibleDatesRef.current = dates;
    
        // push inactive days
        calender.push(...renderInactiveDaysBlocksOnCalenderStart(gInActiveDays));
    
        // push current month days
        calender.push(...renderCurrentMonthDaysBlocks(selectedDate, gMonthLength));
    
        // push rest cells
        calender.push(...renderRestBlocks(gRestDays));

        // display current date in calender header    
        setCalender(calender);

        // push calender event-chips container
        renderCalenderEventLayoutWithChips(gRowsAmount);

        // [functions to render calender layout] //

        /** Renders the leading empty (previous-month) cells before day 1 of the grid. */
        function renderInactiveDaysBlocksOnCalenderStart(pInActiveDays) {
            let days = [];
            for (let index = 0; index < pInActiveDays; index++) {
                days.push(<div className="calender-body-cell-inactive"></div>);
            }
            return days;
        }

        /** Renders one cell per day of the selected month, highlighting today's cell. */
        function renderCurrentMonthDaysBlocks(pSelectedDate, pMonthLength) {
            const days = [];
            const todayDate          = getTodayDate();
            const [year, month, day] = pSelectedDate.split('-').map(Number);
        
            for (let index = 0; index < pMonthLength; index++) {
                const monthDay = index+1;
                const date = `${year}-${month < 10 ? "0"+month : month}-${monthDay < 10 ? "0"+monthDay : monthDay}`;
                
                days.push(
                    <div
                      onDragOver={onOverDragEvent} 
                      className={`calender-body-cell w-full ${date == todayDate ? "calender-body-cell-today" : ""}`}>
                      <span className="m-layout-d"  style={date == todayDate ? { backgroundColor: "var(--danger)" } : {}}> {monthDay} </span>
                      <div className="p-1 pt-[35px] w-full">
                        
                      </div>
                    </div>
                );
            }
    
            return days;
        }
    
        /** Renders the trailing empty (next-month) cells after the last day of the grid. */
        function renderRestBlocks(pRestDays) {
            let days = [];
            for (let index = 0; index < pRestDays; index++) {
                days.push(<div className="calender-body-cell-inactive"></div>);
            }
            return days;
        }

        /** Renders the event-chip overlay grid (one row per week, one cell per weekday). */
        function renderCalenderEventLayoutWithChips(pRowsAmount) {
            const rowsCells = [];

            for (let index = 0; index < pRowsAmount; index++) { // loop through rows
                const cells = [];
                for (let index2 = 0; index2 < 7; index2++) { // loop through columns
                    let date = dates[(index*7)+index2];
                    cells.push(
                        <Box key={`ml-chip-${(index*7)+index2}`} data-month-date={date} className={`events-m-l-item flex-1 z-[${7-(index2)}]`} onMouseDown={(event)=> {onMouseDownEventContainer(event, date)}} onDoubleClick={(event) => openCreateDialogForDate(event, date)} >
                            {createDateChips(date)}
                        </Box>
                    );
                }

                rowsCells.push( <Box key={"_"+index+"_evrow"} className="events-container-row flex"> {cells} </Box> )
            }

            setEventsContainer(rowsCells);
        }

        /**
         * Builds the chips for one day cell: events starting exactly on `pDate`, plus
         * (on a week's Monday cell) any event only continuing through from a previous
         * week. Also reserves "empty chip" placeholders on the following days a
         * multi-day chip visually overlaps, so those cells don't render a duplicate.
         */
        function createDateChips(pDate) {
            const dateIndex = dates.indexOf(pDate);
            const chips = [];
            const isWeekStart = (new Date(pDate)).getDay() === 1; // 1 => Bedeutet Montag
            const events = currentEvents.filter(event => event.period.from.date === pDate );
            isWeekStart && getEventsBetweenDates(pDate).forEach(item=> events.push(item));

            const leerChips = leerChipsDates.filter(date => date == pDate);

            leerChips.forEach((date, index) => {
                chips.push(<div key={"_leer_chip_"+index+pDate+date} className="m-layout-empt-chip-container"></div>);
            });

            sortEventsByStartAscAndEndDesc(events).forEach((pEvent, eventIndex) => {
                const { pType, pWidth, pEventLong } = createData(pEvent, pDate, isWeekStart);

                for (let index = dateIndex+1; index < dateIndex+pEventLong; index++) {
                    const date = dates[index];
                    leerChipsDates.push(date);
                }
                
                chips.push( <MonthEventChip key={"_chip_item_"+eventIndex} id={pEvent.id} pEvent={pEvent} title={pEvent.name} color={getEventColor(pEvent)} type={pType} width={pWidth} onMouseDown={onStartMoveEvent}/> );
            });

            return [...chips];
        }

        /** Events that started before `pDate` but are still ongoing on it (used to carry a multi-day chip into a new week row). */
        function getEventsBetweenDates(pDate) {
            const pDateObj = new Date(pDate);
            return currentEvents.filter(event => {
                const fromDate = new Date(event.period.from.date);
                const toDate = new Date(event.period.to.date || event.period.from.date);

                return (
                    pDateObj > fromDate &&
                    pDateObj <= toDate
                );
            });
        }

        /**
         * Computes one chip's rendering data for `pEvent` starting/continuing on `pDate`:
         * whether its start/end edges are the event's real start/end or just a row-wrap
         * ("start"/"end" on each side), and how many day-cells wide it should be.
         */
        function createData(pEvent, pDate, pIsWeekStart) {
            const dateIndex = dates.indexOf(pDate);
            const weekDayNumber = getWeekDayNumber(pDate) - 1 || 7;
            const eventToDate   = (pEvent.period.to.date || pEvent.period.from.date) > dates[(7 - weekDayNumber) + dateIndex] ? dates[(7 - weekDayNumber) + dateIndex] : (pEvent.period.to.date || pEvent.period.from.date);
            const eventLong     = calculateDaysBetweenDates(pDate, eventToDate) + 1;
            let type = "start-start";

            // handle start chip type
            if (pIsWeekStart && pEvent.period.from.date != pDate) type = "end"
            else type = "start";

            // handle end chip type;
            if (!pEvent.period.to.date) {
                type += "-end";
            } else if (pEvent.period.to.date == pDate) {
                type += "-start";
            } else if (pIsWeekStart && pEvent.period.to.date > dates[dateIndex+7]) {
                type += "-end";
            } else if(!pIsWeekStart && eventToDate != pEvent.period.to.date) {
                type += "-end";
            } else {
                type += "-start";
            }
            
            return {
                pType: type,
                pWidth: eventLong * 100,
                pEventLong: eventLong
            }
        }

        leerChipsDates = [];
    }

    /** Re-derives `eventList` (saved events + drafts) from the shared events store. */
    function getTargetEvents() {
        const eventsList = [...eventsState.eventsList, ...eventsState.newEvents];
        setEventList(eventsList);
    }

    function onOverDragEvent(pEvent) {

    }

    /** Opens the "Alle Veranstaltungen" overflow box for a given day. */
    function onShowMoreClick(pStartDate) {
        setShowMoreDate(pStartDate)
        setOpenShowMoreBox(true);
    }

    /** Builds the chip list shown in the "Alle Veranstaltungen" overflow box for `showMoreDate`. */
    function createShowMoreEvents() {
        const eventsListe = filterByDateAllTypes(eventList, showMoreDate);
        const chips       = [];
        
        eventsListe.forEach(eventItem => {
            chips.push(
                <MonthEventChip key={"shmobox-"+eventItem.id} id={eventItem.id} pEvent={eventItem} title={eventItem.name} color={getEventColor(eventItem)} type={"start-start"} width={"100"} onMouseDown={onStartMoveEvent} onDoubleClick={() => setOpenShowMoreBox(false)}/>
            )
        });

        return chips;
    }

    /*******************************************************************************************/
    /**
     * -----------------------
     * [ Event Moving Logiks ]
     * -----------------------
     */
    /*******************************************************************************************/

    // Guards against the mousedown on an existing chip (which bubbles up to the day
    // cell) from also being interpreted as the start of a "create by dragging" gesture.
    const isMovingEventModeRef = useRef(false);
    function onMouseDownEventContainer(event, pDate) {
        if (event.button !== 0) return;
        const movedEvent = isMovingEventModeRef.current ? dragRef.current?.movedEvent : null;
        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            anchorDate: pDate,
            hoverDate: pDate,
            draftId: null,
            movedEvent,
            moved: false,
            originalFrom: movedEvent?.period.from.date,
            originalTo: movedEvent?.period.to.date || movedEvent?.period.from.date
        };
        document.addEventListener("mousemove", handleMonthPointerMove);
        document.addEventListener("mouseup", handleMonthPointerUp);
    }

    function openCreateDialogForDate(event, date) {
        if (event.target.closest(".m-layout-cell-chip-container")) return;
        setState(prevState => ({
            ...prevState,
            newEventDate: date,
            onSwipeEventID: null,
            toEditSelectedForm: null,
            openDialogs: {
                ...prevState.openDialogs,
                addEventDialog: true
            }
        }));
    }

    /** Begins dragging `pEvent`'s chip: enters move-mode styling and arms the drop listeners. */
    function onStartMoveEvent(pEvent) {
        isMovingEventModeRef.current = true;
        dragRef.current = { movedEvent: pEvent };
        CalenderMonthLayoutContainer.current.classList.add("is-event-move-mode");
    }

    /**
     * Applies the new from/to dates to the dragged event for live visual feedback.
     *
     * The preview uses the shared event object and is committed on pointer-up through
     * `changeEventListHandler`, matching the existing day/period move behavior.
     */
    function updateMovedEvent(pId, pFromDate, pToDate) {
        const targetEvent = [...eventsStateRef.current.eventsList, ...eventsStateRef.current.newEvents].find(eventItem => eventItem.id == pId);
        if (!targetEvent) return;
        targetEvent.period.from.date = pFromDate;
        if (targetEvent.period.to.date) { targetEvent.period.to.date   = pToDate; }
        setEventList([...eventsStateRef.current.eventsList, ...eventsStateRef.current.newEvents]);
    }

    function getDateAtPointer(clientX, clientY) {
        const container = CalenderMonthLayoutContainer.current?.querySelector(".events-m-l-container");
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return null;
        const rows = Math.ceil(visibleDatesRef.current.length / 7);
        const column = Math.min(6, Math.floor((clientX - rect.left) / (rect.width / 7)));
        const row = Math.min(rows - 1, Math.floor((clientY - rect.top) / (rect.height / rows)));
        return visibleDatesRef.current[(row * 7) + column] || null;
    }

    function handleMonthPointerMove(event) {
        const drag = dragRef.current;
        if (!drag) return;
        const hoverDate = getDateAtPointer(event.clientX, event.clientY);
        if (!hoverDate) return;
        drag.moved = drag.moved || Math.abs(event.clientX - drag.startX) >= 10 || Math.abs(event.clientY - drag.startY) >= 10;
        if (!drag.moved) return;

        if (!drag.movedEvent && !drag.draftId) {
            startCreatingEventOnDrag(hoverDate);
        }

        if (hoverDate === drag.hoverDate) return;
        drag.hoverDate = hoverDate;

        if (drag.movedEvent) {
            const diffDays = calculateDaysBetweenDates(drag.originalFrom, hoverDate);
            updateMovedEvent(drag.movedEvent.id, changeDateByDays(drag.originalFrom, diffDays), changeDateByDays(drag.originalTo, diffDays));
        } else {
            updateCreatingEventRange(hoverDate);
        }
    }

    /*******************************************************************************************/
    /**
     * -------------------------
     * [ Event Creating Logiks ]
     * -------------------------
     * Create a new multi-day "Programmpunkt" by pressing down on an empty day cell and
     * dragging across other cells (in any direction, across week rows). Since the month
     * grid has no time-of-day axis, the range is computed purely from day-cell dates
     * (lexicographic "YYYY-MM-DD" comparison, no Date-object/timezone parsing involved)
     * and the draft is created as a full-day event (`attributs.isFullDay: true`).
     * Mirrors the day/period layouts' "create by dragging" flow (staged in
     * `eventsState.newEvents` with `attributs.isNewEvent`, opened in the add-event
     * dialog on drop) — see CalenderPerodLayout.createEventOnSwipe and friends.
     */
    /*******************************************************************************************/

    /**
     * Creates the draft "Programmpunkt" once the drag has reached a different day cell
     * than where it started, spanning from the anchor date to `pHoverDate` (whichever is earlier/later).
     */
    function startCreatingEventOnDrag(pHoverDate) {
        const drag = dragRef.current;
        drag.draftId = generateRandomId(15);

        const anchorDate = drag.anchorDate;
        const fromDate = anchorDate < pHoverDate ? anchorDate : pHoverDate;
        const toDate   = anchorDate < pHoverDate ? pHoverDate : anchorDate;

        const NewEvent = {
            id: drag.draftId,
            name: "unbenannt",
            title: "",
            type: "programm",
            targetEventId: "",
            period: {
                from: { date: fromDate, time: getCurrentTime() },
                to:   { date: toDate,   time: getCurrentTime() }
            },
            breaks: [],
            attributs: {
                isFullDay: true,
                overlapping: false,
                begleiter: false,
                teilnehmer: false,
                isNewEvent: true
            }
        };

        setEventsState(prevState => {
            const nextState = { ...prevState, newEvents: [...prevState.newEvents, NewEvent] };
            eventsStateRef.current = nextState;
            return nextState;
        });
    }

    /** Recomputes the draft event's from/to dates as the drag continues to a new hovered cell. */
    function updateCreatingEventRange(pHoverDate) {
        const drag = dragRef.current;
        const anchorDate = drag.anchorDate;
        const fromDate = anchorDate < pHoverDate ? anchorDate : pHoverDate;
        const toDate   = anchorDate < pHoverDate ? pHoverDate : anchorDate;

        setEventsState(prevState => {
            const nextState = {
                ...prevState,
                newEvents: prevState.newEvents.map(item => item.id === drag.draftId
                ? { ...item, period: { ...item.period, from: { ...item.period.from, date: fromDate }, to: { ...item.period.to, date: toDate } } }
                : item)
            };
            eventsStateRef.current = nextState;
            return nextState;
        });
    }

    /** Ends the "create by dragging" flow: if a draft was created, opens the add-event dialog on it so the user can fill in the name/details. */
    function handleMonthPointerUp() {
        document.removeEventListener("mousemove", handleMonthPointerMove);
        document.removeEventListener("mouseup", handleMonthPointerUp);
        const drag = dragRef.current;

        if (drag?.movedEvent && drag.moved) {
            changeEventListHandler({ ...eventsStateRef.current });
        } else if (drag?.draftId) {
            const targetEvent = eventsStateRef.current.newEvents.find(item => item.id === drag.draftId);
            changeEventListHandler({ ...eventsStateRef.current });
            setState(prevState => ({
                ...prevState,
                onSwipeEventID: drag.draftId,
                toEditSelectedForm: targetEvent,
                openDialogs: {
                    ...prevState.openDialogs,
                    addEventDialog: true
                }
            }));
        }

        CalenderMonthLayoutContainer.current?.classList.remove("is-event-move-mode");
        isMovingEventModeRef.current = false;
        dragRef.current = null;
    }

    return (
        <div className="clalender-month-layout layouts" id="clalender-month-layout" ref={CalenderMonthLayoutContainer} >
            { openShowMoreBox ? 
                <div className="showmore-container flex justify-center items-center bg-darkWhite bg-opacity-10">
                    <ClickAwayListener onClickAway={() => setOpenShowMoreBox(false)}>
                        <div className="showmore-box">
                            <div className="pb-4">
                                <h3>Alle Veranstaltungen</h3>
                            </div>
                            <div>
                                {createShowMoreEvents()}
                            </div>
                        </div>
                    </ClickAwayListener>
                </div>
                : 
                <></>
            }

            <div className="calender-header">
              <div className="calender-header-item d-flex jcc aic"> <div className="flex-col d-flex jcc aic m-layout-h"> <span className="calender-header-week-day">MONTAG</span> </div> </div>
              <div className="calender-header-item d-flex jcc aic"> <div className="flex-col d-flex jcc aic m-layout-h"> <span className="calender-header-week-day">DINSTAG</span> </div> </div>
              <div className="calender-header-item d-flex jcc aic"> <div className="flex-col d-flex jcc aic m-layout-h"> <span className="calender-header-week-day">MITWOCH</span> </div> </div>
              <div className="calender-header-item d-flex jcc aic"> <div className="flex-col d-flex jcc aic m-layout-h"> <span className="calender-header-week-day">DONNERSTAG</span> </div> </div>
              <div className="calender-header-item d-flex jcc aic"> <div className="flex-col d-flex jcc aic m-layout-h"> <span className="calender-header-week-day">FREITAG</span> </div> </div>
              <div className="calender-header-item d-flex jcc aic"> <div className="flex-col d-flex jcc aic m-layout-h"> <span className="calender-header-week-day">SAMSTAG</span> </div> </div>
              <div className="calender-header-item d-flex jcc aic"> <div className="flex-col d-flex jcc aic m-layout-h"> <span className="calender-header-week-day">SONTAG</span> </div> </div>
            </div>

            <div className="calender-body">
                {calender.map((cell, index) => <div key={"cal-mo-ce_"+index} > {cell} </div>) }
                <div className="events-m-l-container">
                    {eventsContainer}
                </div>
            </div>
        </div>
    )
}
