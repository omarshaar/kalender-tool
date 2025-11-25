import PropTypes, { array } from 'prop-types';
import { adjustDates, calculateTimeDifferenceInHours, filterByDate, getDayNameAndMonthDay, getTodayDate } from '../ultis/dates';
import { MainContext } from '../context';
import { useContext, useEffect, useRef, useState } from 'react';
import { EventsContext } from '../context/events';
import DayEventChip from '../components/eventChips/DayEventChip';
import { getCSSVariableValue } from '../ultis/global';
import { filterEventsByPeriod, getEventColor } from '../ultis/events-helpers';
import { MonthEventChip } from '../components';
export const gOneHourHeight = getCSSVariableValue("--hour-row-height");

const CalenderDayLayout = () => {
    const {state, setState} = useContext(MainContext);
    const {eventsState} = useContext(EventsContext);
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

    useEffect(()=> showDay(), [state.selectedDate]);
    useEffect(()=> getTargetEvents(), [eventsState]);
    useEffect(()=> {eventList?.length && renderEvents(); eventList?.length }, [eventList, state.selectedDate]);

    function showDay() {
        setDate(getDayNameAndMonthDay(state.selectedDate)); // get the day name and month day
        getTodayDate() == state.selectedDate ? setActiveDay(true) : setActiveDay(false); // check if the selected date is today
    }

    function getTargetEvents() {
        const eventsList = [...eventsState.eventsList, ...eventsState.newEvents];
        setEventList(eventsList);
    }

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
     * -----------------------
     * [ Event Moving Logiks ]
     * -----------------------
     */
    /*******************************************************************************************/

    function onStartMoveEvent(pEvent, pEventId) {
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
        
    }

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

    // useEffect(()=> {
    //     console.log(eventsContainer);
    // }, [eventsContainer]);

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
                    <div className="day-layout-events-container" id="day-layout-events-container">
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