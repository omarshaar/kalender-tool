/**
 * @file Day view of the calendar ("day-layout"): a single 24-hour timeline for the
 * selected date. "Veranstaltung" (event) items are shown in a header strip
 * (`renderVeranstaltungen`), while "Programmpunkt" (programm) items are placed on
 * the hourly grid with real start/end time precision (`renderEvents`).
 *
 * Dragging a chip's body moves it in time; dragging its top/bottom handle
 * ("event-top-hand"/"event-hand") resizes its start/end instead (see
 * `onStartMoveEvent`/`updateMovedEvent`).
 */

import PropTypes from 'prop-types';
import { adjustDates, calculateTimeDifferenceInHours, convertMinutesToTime, filterByDate, getDayNameAndMonthDay, getTodayDate } from '../ultis/dates';
import { MainContext } from '../context';
import { useContext, useEffect, useRef, useState } from 'react';
import { EventsContext } from '../context/events';
import DayEventChip from '../components/eventChips/DayEventChip';
import { generateRandomId, getCSSVariableValue } from '../ultis/global';
import { filterEventsByPeriod, getEventColor } from '../ultis/events-helpers';
import { MonthEventChip } from '../components';
export const gOneHourHeight = getCSSVariableValue("--hour-row-height");

const CalenderDayLayout = () => {
    const {state, setState} = useContext(MainContext);
    const {eventsState, changeEventListHandler} = useContext(EventsContext);
    const [activeDay, setActiveDay] = useState(null);
    const [date, setDate] = useState(<></>);
    const [eventsContainer, setEventsContainer] = useState([]);
    const [veranstaltungenChips, setVeranstaltungenChips] = useState([]);
    const [eventList, setEventList] = useState([]);
    const layoutContainer  = useRef();
    const initCoords       = {x: 0, y: 0};
    let initMovedEventData = null;
    let lastDiffInMin      = 0;
    let minuteInterval     = 10;
    const boundHandlers    = useRef({move: null, end: null}).current;
    // Guards against the mousedown on an existing chip (which bubbles up to the
    // container) from also being interpreted as the start of a "create by dragging"
    // gesture; set by onStartMoveEvent while an existing chip is being moved/resized.
    const isMovingEventModeRef = useRef(false);
    let intOnSwipeClients   = {x: null, y: null};
    let eventOnSwipeCreated = false;
    let handleStartCreateonSwipeListener;
    let onSwipeEventID;

    useEffect(()=> showDay(), [state.selectedDate]);
    useEffect(()=> getTargetEvents(), [eventsState]);
    useEffect(()=> {eventList?.length && renderEvents(); eventList?.length }, [eventList, state.selectedDate]);

    /** Updates the header label and highlights the header if the selected date is today. */
    function showDay() {
        setDate(getDayNameAndMonthDay(state.selectedDate)); // get the day name and month day
        getTodayDate() == state.selectedDate ? setActiveDay(true) : setActiveDay(false); // check if the selected date is today
    }

    /** Re-derives `eventList` (saved events + drafts) from the shared events store. */
    function getTargetEvents() {
        const eventsList = [...eventsState.eventsList, ...eventsState.newEvents];
        setEventList(eventsList);
    }

    /** Builds the "Programmpunkt" chips placed on the hourly grid for the selected date, with overlap-based width/position. */
    function renderEvents() {
        renderVeranstaltungen();
        setEventsContainer([]);
        const todayEvents = filterByDate(eventList, state.selectedDate);
        let leftIndex = 0;     
        
        todayEvents.sort((a, b) => {
            const dateA = new Date(a.period.from.date);
            const dateB = new Date(b.period.from.date);
            if (dateA - dateB !== 0) {
              return dateA - dateB;
            }
            const timeA = a.period.from.time.split(":").map(Number);
            const timeB = b.period.from.time.split(":").map(Number);
            return timeA[0] - timeB[0] || timeA[1] - timeB[1];
        });

        todayEvents?.map((event, index) => {
            let EventHeight = calculateTimeDifferenceInHours(event.period.from.time, (event.period.to.time || event.period.from.time)) * gOneHourHeight;
            let EventTop    = calculateTimeDifferenceInHours("00:00", event.period.from.time) * gOneHourHeight;
            let EventWidth  = 100;
            let EventLeft   = 0;
            let EventType   = "start-start";

            if (!event.period.to.time || !event.period.to.date || (event.period.from.date != event.period.to.date)) {
                EventType = "start-end";
                EventHeight = calculateTimeDifferenceInHours(event.period.from.time, "23:60") * gOneHourHeight;
            }

            if (!event.period.to.time) {
                EventHeight = 30;
            }

            if (!event.period.to.date) {
                if (!event.period.to.time) {
                    EventHeight = 30;
                }else  {
                    EventHeight = calculateTimeDifferenceInHours(event.period.from.time, event.period.to.time) * gOneHourHeight;
                }
            }

            // handle Height and Top
            if (event.period.from.date != state.selectedDate) {
                if (event.period.to.date != state.selectedDate) {
                    EventHeight = calculateTimeDifferenceInHours("00:00", "23:60") * gOneHourHeight;
                    EventType = "end-end";
                }else {
                    EventHeight = calculateTimeDifferenceInHours("00:00", event.period.to.time || event.period.from.time) * gOneHourHeight;
                    EventType = "end-start";
                }
                EventTop = 0;
            }

            // Handle Over Lapping and Width
            const overLappingEvents = filterEventsByPeriod(todayEvents, event);
            (function handleOverLapping() {
                if (overLappingEvents.length) {
                    EventWidth = 100 / (parseInt(overLappingEvents.length)+1);
                    EventLeft = EventWidth * leftIndex;
                    leftIndex++;
                }else {
                    leftIndex = 0;
                }

                // reset for new overlapping items
                if (leftIndex > overLappingEvents.length) {
                    leftIndex = 0;
                }
            })();

            const { breakHeight, breakStart } = calculateBreaks(event.breaks[0], state.selectedDate, event.period, EventTop);

            setEventsContainer(prev => [...prev, <DayEventChip breakHeight={breakHeight} breakStart={breakStart} color={getEventColor(event)} onMouseDown={onStartMoveEvent} key={"day-event-chip-"+index+"-"+event.id}  title={event.name} start={event.period.from.time} end={event.period.to.time} height={EventHeight} top={EventTop} width={EventWidth} left={EventLeft} type={EventType} id={event.id} pEvent={event} />]);
        });
    }

    /** Computes the pixel height/offset of an event's break ("Pause") gap within its chip, for the given day. */
    function calculateBreaks(pBreakData, pDate, peventPeriod, pEventTop) {
        if (!pBreakData) {
            return {
            breakHeight: 0,
            breakStart: 0
            }
        }

        let breakHeight = 0, breakStart = 0;
        
        if (pDate == pBreakData.from.date && pDate == pBreakData.to.date) {
            breakHeight = calculateTimeDifferenceInHours(pBreakData.from.time, pBreakData.to.time) * 60;
            breakStart = calculateTimeDifferenceInHours(pEventTop > 0 ? peventPeriod.from.time : "00:00", pBreakData.from.time) * 60;
        } else if(pDate == pBreakData.from.date && pDate != pBreakData.to.date) {
            breakHeight = calculateTimeDifferenceInHours(pBreakData.from.time, "23:59") * 60;
            breakStart = calculateTimeDifferenceInHours(pEventTop > 0 ? peventPeriod.from.time : "00:00", pBreakData.from.time) * 60;
        }else if (pDate != pBreakData.from.date && pDate == pBreakData.to.date) {
            breakHeight = calculateTimeDifferenceInHours("00:00", pBreakData.to.time) * 60;
            breakStart = 0;
        } else if (pDate > pBreakData.from.date && pDate < pBreakData.to.date) {
            breakHeight = calculateTimeDifferenceInHours("00:00", "23:59") * 60;
            breakStart = 0; 
        }

        return {
            breakHeight: breakHeight || 0,
            breakStart: breakStart || 0
        }
    }

    /** Builds the "Veranstaltung" chips shown in the header strip above the hourly grid. */
    function renderVeranstaltungen() {
        const todayVeranstaltungen = filterByDate(eventList, state.selectedDate, true);

        setVeranstaltungenChips([]);
        
        todayVeranstaltungen.forEach((veranstaltung, index) => {
            let type = "start-start";

            if (veranstaltung.period.from.date == state.selectedDate && (veranstaltung.period.to.date || veranstaltung.period.from.date) == state.selectedDate ) {
                type = "start-start";
            }else if (veranstaltung.period.from.date == state.selectedDate && veranstaltung.period.to.date != state.selectedDate) {
                type = "start-end";
            }else if (veranstaltung.period.from.date != state.selectedDate && veranstaltung.period.to.date == state.selectedDate) {
                type = "end-start";
            }else if (veranstaltung.period.from.date != state.selectedDate && veranstaltung.period.to.date != state.selectedDate) {
                type = "end-end";
            }

            setVeranstaltungenChips(prevChips => [
                ...prevChips,
                <MonthEventChip 
                  id={veranstaltung.id+"_event"} 
                  color={getEventColor(veranstaltung)} 
                  title={veranstaltung.name} 
                  type={type} 
                  width={100}  
                  pEvent={veranstaltung}
                />
            ]);
        });
    }

    /*******************************************************************************************/
    /**
     * -------------------------
     * [ Event Creating Logiks ]
     * -------------------------
     * Mirrors the period layout's "create by dragging" flow (see
     * CalenderPerodLayout.createEventOnSwipe and friends), simplified for a single day:
     * there is no day-column index to track, since every draft is created on
     * `state.selectedDate`.
     */
    /*******************************************************************************************/

    /** Arms the "create by dragging" listeners for a mousedown on the events container. */
    function createEventOnSwipe(ev) {
        handleStartCreateonSwipeListener = handleStartCreateonSwipe.bind(null);

        document.addEventListener("mousemove", handleStartCreateonSwipeListener);
        document.addEventListener("mouseup", handleEndCreateonSwipe);

        intOnSwipeClients.x = ev.clientX;
        intOnSwipeClients.y = ev.clientY;
    }

    /**
     * Once the drag exceeds a small threshold, creates a new draft "Programmpunkt"
     * (30 min, staged in `eventsState.newEvents` with `attributs.isNewEvent`), then
     * keeps stretching its end time as the drag continues.
     */
    function handleStartCreateonSwipe(event) {
        const currentY = event.clientY;
        const columnTop = layoutContainer.current.querySelector(".day-layout-events-container").getBoundingClientRect().top;

        if (currentY - 20 > intOnSwipeClients.y && !isMovingEventModeRef.current) {
            if (!eventOnSwipeCreated) {
                // create Event
                onSwipeEventID = generateRandomId(15);

                setState(prevState => ({
                    ...prevState,
                    onSwipeEventID: onSwipeEventID
                }))

                const NewEvent = {
                    id: onSwipeEventID,
                    name: "unbenannt",
                    title: "",
                    type: "programm",
                    targetEventId: "",
                    period: {
                        from: {
                            date: state.selectedDate,
                            time: convertMinutesToTime(Math.round(parseInt(intOnSwipeClients.y - columnTop) / 10) * 10),
                        },
                        to: {
                            date: state.selectedDate,
                            time: convertMinutesToTime((Math.round(parseInt(intOnSwipeClients.y - columnTop) / 10) * 10) + 30),
                        }
                    },
                    breaks: [],
                    attributs: {
                        isFullDay: false,
                        overlapping: false,
                        begleiter: false,
                        teilnehmer: false,
                        isNewEvent: true
                    }
                }

                eventsState.newEvents?.push(NewEvent);
                changeEventListHandler({ ...eventsState });
                initMovedEventData = JSON.parse(JSON.stringify(NewEvent));
            }

            eventOnSwipeCreated = true;
        }

        if (eventOnSwipeCreated) {
            handleMoveSwipEvent(event);
        }
    }

    /** Recomputes the draft event's end time from how far the drag has moved. */
    function handleMoveSwipEvent(pEvent) {
        let currentY = pEvent.clientY;
        let diffInMin = currentY - intOnSwipeClients.y;

        // round time
        diffInMin = Math.round(diffInMin / minuteInterval) * minuteInterval - 30;

        if (Math.abs(diffInMin - lastDiffInMin) >= minuteInterval) {
            const period = initMovedEventData.period;
            const newData = adjustDates(period.from.date, period.from.time, period.to.date, period.to.time, diffInMin);
            updateSwipedEvent(newData, initMovedEventData.id);
            lastDiffInMin = diffInMin;
        }
    }

    /** Applies the recomputed end time to the in-progress draft event (mutates it directly in `eventsState.newEvents`). */
    function updateSwipedEvent(pNewData, pEventId) {
        if (initMovedEventData.period.from.date > pNewData.newEndDate.date) {
            return
        }
        const targetEvent = eventsState.newEvents.filter(item => item.id == pEventId)[0];
        if ((initMovedEventData.period.from.time < pNewData.newEndDate.time) || initMovedEventData.period.from.date != pNewData.newEndDate.date) {
            targetEvent.period.to.time = pNewData.newEndDate.time;
            targetEvent.period.to.date = pNewData.newEndDate.date;
            changeEventListHandler({ ...eventsState });
        }
    }

    /** Ends the "create by dragging" flow: if a draft was created, opens the add-event dialog on it so the user can fill in the name/details. */
    function handleEndCreateonSwipe() {
        document.removeEventListener("mousemove", handleStartCreateonSwipeListener);
        document.removeEventListener("mouseup", handleEndCreateonSwipe);

        const targetEvent = eventsState.newEvents.filter(item => item.id == onSwipeEventID)[0];

        if (eventOnSwipeCreated) {
            setState(prevState => ({
                ...prevState,
                toEditSelectedForm: targetEvent,
                openDialogs: {
                    ...prevState.openDialogs,
                    addEventDialog: true
                }
            }));
        }

        initMovedEventData = null;
        eventOnSwipeCreated = false;
        lastDiffInMin = 0;
    }

    /*******************************************************************************************/
    /**
     * -----------------------
     * [ Event Moving Logiks ]
     * -----------------------
     */
    /*******************************************************************************************/

    /** Begins dragging/resizing `pEventId`'s chip; detects whether a resize handle (top/bottom) was grabbed instead of the body. */
    function onStartMoveEvent(pEvent, pEventId) {
        isMovingEventModeRef.current = true;

        initCoords.x = pEvent.clientX;
        initCoords.y = pEvent.clientY;
        const isBottomExpansion = Array.from(pEvent.target.classList).includes("event-hand");
        const isTopExpansion    = Array.from(pEvent.target.classList).includes("event-top-hand");
        
        boundHandlers.move = handleMoveEvent.bind(null, isBottomExpansion, isTopExpansion);
        boundHandlers.end = handleMoveEnd;

        if (!initMovedEventData) {
            const targetEvent = eventList.filter(item=> item.id == pEventId)[0];
            initMovedEventData = JSON.parse(JSON.stringify(targetEvent));
        }

        layoutContainer.current.addEventListener("mousemove", boundHandlers.move);
        layoutContainer.current.addEventListener("touchmove", boundHandlers.move);
        document.addEventListener("mouseup", boundHandlers.end);
        document.addEventListener("touchend", boundHandlers.end);

        if (isBottomExpansion || isTopExpansion) {
            document.body.style.cursor = 'n-resize';
        }else {
            document.body.style.cursor = 'grab';
        }
    }

    /** Recomputes the dragged/resized event's new start/end from the mouse's vertical movement, snapped to `minuteInterval`. */
    function handleMoveEvent(pIsBottomExpansion, pIsTopExpansion, pEvent) {
        let currentY = pEvent.clientY;
        let diffInMin = currentY - initCoords.y;

        diffInMin = Math.round(diffInMin / minuteInterval) * minuteInterval;
    
        if (Math.abs(diffInMin - lastDiffInMin) >= minuteInterval) {
            const period = initMovedEventData.period;
            const newData = adjustDates(period.from.date, period.from.time, (period.to.date || period.from.date), (period.to.time || period.from.time), diffInMin);
            updateMovedEvent(newData, initMovedEventData.id, pIsBottomExpansion, pIsTopExpansion);
            lastDiffInMin = diffInMin;
        }
    }

    /** Ends the drag/resize: detaches the listeners and flags unsaved changes if the movement exceeded the click threshold. */
    function handleMoveEnd(event) {
        layoutContainer.current.removeEventListener("mousemove", boundHandlers.move);
        layoutContainer.current.removeEventListener("touchmove", boundHandlers.move);
        document.removeEventListener("mouseup", boundHandlers.end);
        document.removeEventListener("touchend", boundHandlers.end);

        let currentX = event.clientX;
        let currentY = event.clientY;
        
        boundHandlers.move = null;
        boundHandlers.end = null;

        document.body.style.cursor = 'auto';

        if (Math.abs(currentY - initCoords.y) >= 5) {
            setState(prevState => ({
                ...prevState,
                eventsChanged: true
            }));
        }

        initCoords.x = 0;
        initCoords.y = 0;
        isMovingEventModeRef.current = false;
    }

    /**
     * Applies the recomputed date/time to the dragged event for live visual feedback
     * (moves it if neither handle was grabbed, otherwise resizes only the grabbed end).
     * Mutates the event object in place (shared reference with `eventsState`); only
     * made official once `handleMoveEnd` flags the change as unsaved.
     */
    function updateMovedEvent(pNewData, pEventId, pIsBottomExpansion, pIsTopExpansion) {
        const targetEvent = eventList.filter(item=> item.id == pEventId)[0];

        if(!pIsBottomExpansion && !pIsTopExpansion){
            targetEvent.period.from.date = pNewData.newStartDate.date;
            targetEvent.period.from.time = pNewData.newStartDate.time;
            if (targetEvent.period.to.date) { targetEvent.period.to.date   = pNewData.newEndDate.date; }
            if (targetEvent.period.to.time) { targetEvent.period.to.time = pNewData.newEndDate.time; }
        }else if (pIsBottomExpansion) {
            if (initMovedEventData.period.from.time < pNewData.newEndDate.time && pIsBottomExpansion) {
                if (targetEvent.period.to.time) { targetEvent.period.to.time = pNewData.newEndDate.time; }
            }
        }else if (pIsTopExpansion) {
            if (initMovedEventData.period.to.time > pNewData.newStartDate.time && pIsTopExpansion) {
                targetEvent.period.from.time = pNewData.newStartDate.time;
            }
        }

        setEventList([...eventList]);
    }

    return (
        <div className="calender-day-layout layouts" id="calender-day-layout">
            <div className="calender-header">
                <div className="calender-header-item d-flex jcc aic">
                    <div className={ activeDay ? "calender-header-item-active" : ""} id="calender-header-item">
                        {date}
                    </div>
                </div>
            </div>

            <div className="p-n-events-container" id="p-n-events-container-day-layout"> {veranstaltungenChips} </div>

            <div className="calender-body-day-layout-wrapper scroll-x hide-scrollbar" id="calender-body-day-layout-wrapper" ref={layoutContainer}>
                <div className="time-line" id="time-line"></div>

                <div className="calender-body">
                    <div className="day-layout-events-container" id="day-layout-events-container" onMouseDown={createEventOnSwipe}>
                        {/* Add event handler in React way */}
                        {eventsContainer}
                    </div>

                    {[...Array(24)].map((_, hour) => (
                        <div key={hour} className="calender-day-layout-hour-row d-flex aic">
                            <div className="hour-row-head d-flex jcc">
                                <span style={{ backgroundColor: 'var(--bg)', height: 'max-content' }}>{`${hour.toString().padStart(2, '0')}:00`}</span>
                            </div>
                            <div className="hour-row-body">
                                <div className="hour-row-half">
                                    <div className="hour-row-quarter"></div>
                                    <div className="hour-row-quarter"></div>
                                </div>
                                <div className="hour-row-half">
                                    <div className="hour-row-quarter"></div>
                                    <div className="hour-row-quarter"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

CalenderDayLayout.propTypes = {};

export default CalenderDayLayout;