import { useContext, useEffect, useRef, useState } from "react";
import { MainContext } from "../context";
import { calculateDateDifference, calculateDaysBetweenDates, changeDateByDays, filterByDate, filterByDateAllTypes, generateDateRange, generateDatesRangeMonthLayout, getDaysInMonth, getTodayDate, getWeekDayNumber, getWeekDayNumberWeekStartMonday } from "../ultis/dates";
import { EventsContext } from "../context/events";
import { MonthEventChip } from "../components";
import { Box } from "@mui/system";
import { filterEventsByMonth, getEventColor, sortEventsByStartAscAndEndDesc } from "../ultis/events-helpers";
import { createMonthChipData } from "./creating";
import { ClickAwayListener } from "@mui/material";

export default function CalenderMonthLayout(props) {
    const {state, setState} = useContext(MainContext);
    const {eventsState} = useContext(EventsContext);
    const [calender, setCalender] = useState([<></>]);
    const [eventsContainer, setEventsContainer] = useState(<></>);
    const [eventList, setEventList] = useState([]);
    const [currentEvents, setCurrentEvents] = useState([]);
    const [moveOverDate, setMoveOverDate] = useState("");
    const [moveStartDate, setMoveStartDate] = useState("");
    const [movedEvent, setMovedEvent] = useState(null);
    const [openShowMoreBox, setOpenShowMoreBox] = useState(false);
    const [showMoreDate, setShowMoreDate] = useState("");
    const CalenderMonthLayoutContainer = useRef();
    let handled = [];
    let showMoreRecord = [];

    useEffect(()=> createMonthLayout(), [state.selectedDate, currentEvents]);
    useEffect(()=> { getTargetEvents(); },[eventsState]);
    useEffect(()=> { eventList.length && setCurrentEvents(filterEventsByMonth(eventList, state.selectedDate)); },[eventList, state.selectedDate]);
    useEffect(()=> { moveStartDate && movedEvent && moveOverDate && onMoveEvent(); },[moveOverDate, moveStartDate, movedEvent]);

    function createMonthLayout(pDateStr) {
        const calender = [];
        const selectedDate       = pDateStr || state.selectedDate;
        const [year, month, day] = selectedDate.split('-').map(Number);
    
        let gMonthStartDay = getWeekDayNumber(`${year}-${month}-01`);
        let gMonthLength   = getDaysInMonth(selectedDate);
        let gInActiveDays  = gMonthStartDay == 1 ? 6 : gMonthStartDay - 2;
        let gSumOfCells    = gInActiveDays + gMonthLength;
        let gRowsAmount    = (Math.floor(gSumOfCells / 5)) - 1;
        let gRestDays      = (gRowsAmount * 7) - gSumOfCells; // 7 is the number of days in a week (cloumns)
        const dates        = generateDatesRangeMonthLayout(selectedDate,gInActiveDays ? gInActiveDays - 1 : gInActiveDays,gRestDays ? gRestDays + 1 : gRestDays);
    
        // push inactive days
        calender.push(...renderInactiveDaysBlocksOnCalenderStart(gInActiveDays));
    
        // push current month days
        calender.push(...renderCurrentMonthDaysBlocks(selectedDate, gMonthLength));
    
        // push rest cells
        calender.push(...renderRestBlocks(gRestDays));

        // display current date in calender header    
        setCalender(calender);

        // push calender event-chips container
        renderCalenderEventsLayoutAndChips(gRowsAmount);

        // render chips
        createChips(sortEventsByStartAscAndEndDesc(currentEvents), dates);
        
        // [functions to render calender layout] //
        function renderInactiveDaysBlocksOnCalenderStart(pInActiveDays) {
            let days = [];
            for (let index = 0; index < pInActiveDays; index++) {
                days.push(<div className="calender-body-cell-inactive"></div>);
            }
    
            return days;
        }

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
    
        function renderRestBlocks(pRestDays) {
            let days = [];
            for (let index = 0; index < pRestDays; index++) {
                days.push(<div className="calender-body-cell-inactive"></div>);
            }
            return days;
        }

        function renderCalenderEventsLayoutAndChips() {
            const cells = [];
            dates.forEach((date, index) => {
                cells.push(
                    <Box key={`ml-chip-${index}`} className={`events-m-l-item z-[${dates.length-index}]`} onMouseOver={()=> {onMouseOverEventContainer(date)}} onMouseDown={(event)=> {onMouseDownEventContainer(event, date)}} ></Box>
                );
            });
            setEventsContainer(cells);
        }
    }

    function onOverDragEvent(pEvent) {
        
    }

    function getTargetEvents() {
        const eventsList = [...eventsState.eventsList, ...eventsState.newEvents];
        setEventList(eventsList);
    }

    function onShowMoreClick(pStartDate) {
        setShowMoreDate(pStartDate)
        setOpenShowMoreBox(true);
    }
    
    function createChips(pCurrentEvents, pDatesRange) {
        pCurrentEvents.forEach(pEvent => {
            let type = "current";
            let fromData = pEvent.period.from.date, toDate = pEvent.period.to.date;
            if (fromData < pDatesRange[0] && toDate < pDatesRange[pDatesRange.length-1]) { type = "prev"; }
            else if (fromData >= pDatesRange[0] && toDate <= pDatesRange[pDatesRange.length-1]) { type = "current"; }
            else if(fromData < pDatesRange[0] && toDate > pDatesRange[pDatesRange.length-1] ) { type = "between"; } // end-end
            else if(fromData >= pDatesRange[0] && toDate > pDatesRange[pDatesRange.length-1] ) { type = "current-next"; } // start-end

            createMonthChipData(pEvent, type, pDatesRange, (type, dateStart, width, emptysLong) => {
                const dateIndex = pDatesRange.indexOf(dateStart);
                handled.push(...generateDateRange(pEvent.period.from.date, pEvent.period.to.date));

                if ((handled.filter(item => item == dateStart))?.length > 2) {
                    if ((showMoreRecord.filter(item => item == dateIndex)?.length)) {
                        return
                    }

                    showMoreRecord.push(dateIndex);
                    setEventsContainer(prevEventsContainer => {
                        const updatedCells = [...prevEventsContainer];

                        updatedCells[dateIndex] = React.cloneElement(
                            updatedCells[dateIndex],
                            { key: updatedCells[dateIndex].key },
                            <>
                                {updatedCells[dateIndex].props.children}
                                <div className="m-layout-showmore-chip-container" onClick={()=> onShowMoreClick(dateStart)} >Alle</div>
                            </>
                        );
                        return updatedCells;
                    });
                }
                else {
                    setEventsContainer(prevEventsContainer => {
                        const updatedCells = [...prevEventsContainer];
                        updatedCells[dateIndex] = React.cloneElement(
                            updatedCells[dateIndex],
                            { key: updatedCells[dateIndex].key },
                            <>
                                {updatedCells[dateIndex].props.children}
                                <MonthEventChip id={pEvent.id} pEvent={pEvent} title={pEvent.name} color={getEventColor(pEvent)} type={type} width={width} onMouseDown={onStartMoveEvent}/>
                            </>
                        );

                        for (let i = dateIndex + 1; i <= dateIndex + emptysLong; i++) {
                            if (updatedCells[i]) {
                                updatedCells[i] = React.cloneElement(
                                    updatedCells[i],
                                    { key: updatedCells[i].key },
                                    <>
                                        {updatedCells[i].props.children}
                                        <div className="m-layout-empt-chip-container"></div>
                                    </>
                                );
                            }
                        }
                        return updatedCells;
                    });
                }

                
            });
        });
        handled = [];
    }

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

    let initMoveCoords    = { x: 0, y: 0 };
    let currentMoveCoords = { x: null, y: null };

    function onMouseOverEventContainer(pDate) {
        setMoveOverDate(pDate);
    }

    function onMouseDownEventContainer(event, pDate) {    
        setMoveStartDate(pDate);
        initMoveCoords.x = event.clientX; 
        initMoveCoords.y = event.clientY;
        document.addEventListener("mousemove", onMouseMove);
    }

    function onStartMoveEvent(pEvent) {
        CalenderMonthLayoutContainer.current.classList.add("is-event-move-mode");
        ["touchend", "mouseup"].map(eventName => document.addEventListener(eventName, onEndMoveEvent) );
        setMovedEvent(pEvent);
    }

    function onEndMoveEvent() {
        CalenderMonthLayoutContainer.current.classList.remove("is-event-move-mode");
        ["touchend", "mouseup"].map(eventName => document.removeEventListener(eventName, onEndMoveEvent) );
        setMoveStartDate("");

        if ((currentMoveCoords.x !== null && currentMoveCoords.y !== null) && (Math.abs(currentMoveCoords.x - initMoveCoords.x) >= 10 || Math.abs(currentMoveCoords.y - initMoveCoords.y) >= 10)) {            
            setState(prevState => ({
                ...prevState,
                eventsChanged: true
            }));
        }

        setMovedEvent(null);
    }

    function onMoveEvent() {
        const diffDays = calculateDaysBetweenDates(movedEvent.period.from.date, moveOverDate);
        let fromDate = changeDateByDays(movedEvent.period.from.date, diffDays);
        let toDate = changeDateByDays(movedEvent.period.to.date, diffDays);
        updateMovedEvent(movedEvent.id, fromDate, toDate);
    }

    function updateMovedEvent(pId, pFromDate, pToDate) {
        const targetEvent = eventList.filter(eventItem => eventItem.id == pId)[0];
        targetEvent.period.from.date = pFromDate;
        targetEvent.period.to.date   = pToDate;
        setEventList([...eventList]);
    }

    function onMouseMove(event) {
        currentMoveCoords.x = event.clientX; 
        currentMoveCoords.y = event.clientY;
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
                <div className="events-m-l-container grid grid-cols-7">
                    {eventsContainer}
                </div>
            </div>
        </div>
    )
}