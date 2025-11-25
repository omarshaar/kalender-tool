import { useContext, useEffect, useRef, useState } from "react";
import { MainContext } from "../context";
import { calculateDateDifference, calculateDaysBetweenDates, changeDateByDays, filterByDateAllTypes, generateDateRange, generateDatesRangeMonthLayout, getDaysInMonth, getTodayDate, getWeekDayNumber } from "../ultis/dates";
import { EventsContext } from "../context/events";
import { MonthEventChip } from "../components";
import { Box, width } from "@mui/system";
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
        console.log("================================");
        
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

        function renderCalenderEventLayoutWithChips(pRowsAmount) {
            const rowsCells = [];

            for (let index = 0; index < pRowsAmount; index++) { // loop through rows
                const cells = [];
                for (let index2 = 0; index2 < 7; index2++) { // loop through columns
                    let date = dates[(index*7)+index2];
                    cells.push(
                        <Box key={`ml-chip-${(index*7)+index2}`} className={`events-m-l-item flex-1 z-[${7-(index2)}]`} onMouseOver={()=> {onMouseOverEventContainer(date)}} onMouseDown={(event)=> {onMouseDownEventContainer(event, date)}} >
                            {createDateChips(date)}
                        </Box>
                    );
                }

                rowsCells.push( <Box key={"_"+index+"_evrow"} className="events-container-row flex"> {cells} </Box> )
            }

            setEventsContainer(rowsCells);
        }

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

        function createData(pEvent, pDate, pIsWeekStart) {
            const dateIndex = dates.indexOf(pDate);
            const weekDayNumber = getWeekDayNumber(pDate) - 1 || 7;
            const eventToDate   = (pEvent.period.to.date || pEvent.period.from.date) > dates[(7 - weekDayNumber) + dateIndex] ? dates[(7 - weekDayNumber) + dateIndex] : (pEvent.period.to.date || pEvent.period.from.date);
            const eventLong     = calculateDaysBetweenDates(pDate, eventToDate) + 1;
            let type = "start-start", width = 100; 

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

    function getTargetEvents() {
        const eventsList = [...eventsState.eventsList, ...eventsState.newEvents];
        setEventList(eventsList);
    }

    function onOverDragEvent(pEvent) {
        
    }

    function onShowMoreClick(pStartDate) {
        setShowMoreDate(pStartDate)
        setOpenShowMoreBox(true);
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
        let toDate = changeDateByDays((movedEvent.period.to.date || movedEvent.period.from.date), diffDays);
        updateMovedEvent(movedEvent.id, fromDate, toDate);
    }

    function updateMovedEvent(pId, pFromDate, pToDate) {
        const targetEvent = eventList.filter(eventItem => eventItem.id == pId)[0];
        targetEvent.period.from.date = pFromDate;
        if (targetEvent.period.to.date) { targetEvent.period.to.date   = pToDate; }
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
                <div className="events-m-l-container">
                    {eventsContainer}
                </div>
            </div>
        </div>
    )
}