import { use, useContext, useEffect, useRef, useState } from "react";
import { MainContext } from "../context";
import { adjustDates, calculateDateDifference, calculateTimeDifferenceInHours, changeDateByDays, convertMinutesToTime, filterByDate, filterEventsBetweenDates, filterEventsByEventId, generateDateRange, generateDateRangeWithoutEmptys, getDayNameAndMonthDay, getTodayDate } from "../ultis/dates";
import { MonthEventChip, MyButton, MyInput } from "../components";
import PeriodEventChip from "../components/eventChips/PeriodEventChip";
import { EventsContext } from "../context/events";
import { filterEventsByPeriod, getEventColor, sortEventsByStartAscAndEndDesc } from "../ultis/events-helpers";
import { gOneHourHeight } from "./CalenderDayLayout";
import { generateRandomId } from "../ultis/global";
import { Box } from "@mui/material";
import Icons from "../assetes/Icons";


export default function CalenderPerodLayout(props) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const { state, setState } = useContext(MainContext);
    const {eventsState, changeEventListHandler} = useContext(EventsContext);
    const [inputsValues, setInputsValues] = useState({ from: "", to: "" });
    const [calenderHeader, setCalenderHeader] = useState([<></>]);
    const [layoutBody, setLayoutBody] = useState([<></>]);
    const [veranstaltungenChipsContainer, setVeranstaltungenChipsContainer] = useState([]);
    const [DateRange, setDateRange] = useState([]);
    const [eventList, setEventList] = useState([]);
    const [tooltipData, setToolTipData] = useState(null);
    const toolTip                          = useRef();
    const gPNEventsContainerPeriodLayout   = useRef(null);
    const gCalenderbodyperiodlayoutWrapper = useRef(null);
    let gDateRange            = undefined;
    let gShowPeriodEmptyDays  = undefined;
    const boundHandlers       = useRef({move: null, end: null}).current;
    const initCoords          = {x: 0, y: 0};
    let initMovedEventData    = null;
    let lastDiffInMin         = 0;
    let minuteInterval        = 10;
    const moveOverIndex       = useRef(null);
    let initMoveColumnIndex   = null;
    let initPNColumnIndex     = null;
    let initPNPeriod          = {};
    let intOnSwipeClients     = {x: null, y: null};
    let eventOnSwipeCreated   = false;
    const isMovingEventModeRef = useRef(false);
    let handleStartCreateonSwipeListener;
    let onSwipeEventID;
 
    useEffect(() => createPeroidLayout(), [state.periodDate, eventList, state.hiddenEmptyDays, state.displayOnEventTimeRange, state.targetDisplayEventID]);
    useEffect(()=> { getTargetEvents(); },[eventsState]);
    useEffect(() => {
      handleLayoutBodyWidth(DateRange);
    }, [calenderHeader, DateRange]);
    useEffect(() => {
      setState(prevState => ({
        ...prevState,
        dateRange: DateRange
      }));
    }, [DateRange]);
  
    function createPeroidLayout() {
      const selecteEventID = new URLSearchParams(location.search).get('vid');
      const isEventTimeRange = state.displayOnEventTimeRange;
      const eventListe = state.targetDisplayEventID ? filterEventsByEventId(eventsState.eventsList, selecteEventID) : eventsState.eventsList;

      if (state.hiddenEmptyDays) {
        gDateRange = generateDateRangeWithoutEmptys(filterEventsBetweenDates(eventListe, state.periodDate.from, state.periodDate.to));
        setDateRange(gDateRange);
      } else {
        if (isEventTimeRange) {
          const targetEvent = [...eventsState.eventsList, ...eventsState.newEvents].filter(event => event.id === selecteEventID)[0];
          if (targetEvent) {        
            gDateRange = generateDateRange(
              changeDateByDays(targetEvent.period.from.date, -1),
              changeDateByDays(targetEvent.period.to.date, 1)
            );
            setDateRange(gDateRange);
          }
        }else {
          gDateRange = generateDateRange(state.periodDate.from, state.periodDate.to);
          setDateRange(gDateRange);
        }
      }

      setCalenderHeader(cerateLayoutHeader());
      setLayoutBody(createLayoutBody());
      renderVeranstaltungen();
    }

    function cerateLayoutHeader() {
      const firstmMonth = parseInt(gDateRange[0]?.split("-")[1]);
      const lastMonth = parseInt(gDateRange[gDateRange.length - 1]?.split("-")[1]);
      const showMonth = firstmMonth !== lastMonth;
  
      return gDateRange.map((date, index) => (
        <div key={"clp-key_" + index} className="period-calender-header-item d-flex jcc aic">
          <div className={date === getTodayDate() ? "calender-header-item-active" : ""} id="calender-header-item">
            {getDayNameAndMonthDay(date, showMonth)}
          </div>
        </div>
      ));
    }

    function getTargetEvents() {
      const eventsList = [...eventsState.eventsList, ...eventsState.newEvents];
      setEventList(eventsList);
    }

    function createLayoutBody() {
      const newLayoutBody = gDateRange.map((date, index) => (
        <div
          key={"asdaqapa"+index}
          onMouseDown={(ev) => createEventOnSwipe(ev, index)}
          onMouseOver={() => handleMoveDrageEvent(index)}
          data-event-date={date}
          className="period-layout-events-col"
        >
          {createEventsChips(date, index)}
        </div>
      ));
      return newLayoutBody;
    }
  
    function createEventOnSwipe(ev, pIndex) {
      initMoveColumnIndex = pIndex;
  
      handleStartCreateonSwipeListener = handleStartCreateonSwipe.bind(null, pIndex);
  
      document.addEventListener("mousemove", handleStartCreateonSwipeListener);
      document.addEventListener("mouseup", handleEndCreateonSwipe);
  
      intOnSwipeClients.x = ev.clientX;
      intOnSwipeClients.y = ev.clientY;
    }

    function handleStartCreateonSwipe(pIndex, event) {
      const currentX = event.clientX;
      const currentY = event.clientY;
      const columnTop =  document.querySelector(".period-layout-events-col").getBoundingClientRect().top;
      
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
                date: gDateRange[pIndex],
                time: convertMinutesToTime(Math.round(parseInt(intOnSwipeClients.y - columnTop) / 10) * 10),
              },
              to: {
                date: gDateRange[pIndex],
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

    function handleMoveSwipEvent(pEvent) {
      let currentY = pEvent.clientY;
      let diffInDay = (moveOverIndex.current - initMoveColumnIndex) * (60*24);
      let diffInMin = (currentY - intOnSwipeClients.y) + diffInDay;
      
      // round time
      diffInMin = Math.round(diffInMin / minuteInterval) * minuteInterval - 30;

      if (Math.abs(diffInMin - lastDiffInMin) >= minuteInterval) {
        const period = initMovedEventData.period;
        const newData = adjustDates(period.from.date, period.from.time, period.to.date, period.to.time, diffInMin);
        updateSwipedEvent(newData, initMovedEventData.id);
        lastDiffInMin = diffInMin;
      }
    }

    function updateSwipedEvent(pNewData, pEventId) {
      if (initMovedEventData.period.from.date > pNewData.newEndDate.date) {
        return
      }
      const targetEvent = eventsState.newEvents.filter(item=> item.id == pEventId)[0];     
      if ((initMovedEventData.period.from.time < pNewData.newEndDate.time) || initMovedEventData.period.from.date != pNewData.newEndDate.date) {
        targetEvent.period.to.time = pNewData.newEndDate.time;
        targetEvent.period.to.date = pNewData.newEndDate.date;
        changeEventListHandler({ ...eventsState });
      }
    }

    function handleEndCreateonSwipe() {
      document.removeEventListener("mousemove", handleStartCreateonSwipeListener);
      document.removeEventListener("mouseup", handleEndCreateonSwipe);

      const targetEvent = eventsState.newEvents.filter(item=> item.id == onSwipeEventID)[0];

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
  
    function handleMoveDrageEvent(pIndex) {
      moveOverIndex.current = pIndex;
    }

    function changeSelectedDateRang() {
      if (inputsValues.from && inputsValues.to) {
        setState(prevState => ({
          ...prevState,
          periodDate: { from: inputsValues.from, to: inputsValues.to }
        }));
        localStorage.setItem("periodDateFrom", inputsValues.from);
        localStorage.setItem("periodDateTo", inputsValues.to);
      }
    }

    function handleLayoutBodyWidth(pDateRange) {
      const gPeriodCalenderHeaderItems = document.querySelectorAll('.period-calender-header-item');
      if (gPeriodCalenderHeaderItems?.length <= 0) {
        return;
      }
      if (!pDateRange) {
        return;
      }
      const width = parseInt(window.getComputedStyle(gPeriodCalenderHeaderItems[0]).width) * pDateRange.length;
      gCalenderbodyperiodlayoutWrapper.current.style.width = width + "px";
      gPNEventsContainerPeriodLayout.current.style.width = width + "px";
    }

    function createEventsChips(pDate, pIndex) {
      let dateEvents = filterByDate(eventList, pDate);
      const chips = [];
      let leftIndex = 0;
      let canNoteOverLappingEvent = null;
      
      if (state.targetDisplayEventID) {
        dateEvents = filterByDate(filterEventsByEventId(eventList, new URLSearchParams(location.search).get('vid')), pDate);               
      } 

      dateEvents.sort((a, b) => {
        const dateA = new Date(a.period.from.date);
        const dateB = new Date(b.period.from.date);
        if (dateA - dateB !== 0) {
          return dateA - dateB;
        }
        const timeA = a.period.from.time.split(":").map(Number);
        const timeB = b.period.from.time.split(":").map(Number);
        return timeA[0] - timeB[0] || timeA[1] - timeB[1];
      });

      dateEvents.forEach((event, index) => {
        let EventHeight = calculateTimeDifferenceInHours(event.period.from.time, event.period.to.time || event.period.from.time) * gOneHourHeight;
        let EventTop    = calculateTimeDifferenceInHours("00:00", event.period.from.time) * gOneHourHeight;
        let EventWidth  = 100;
        let EventLeft   = 0;
        let EventType   = "start-start";

        if (!event.period.to.time || !event.period.to.date) {
          EventType = "start-end";
        }
        
        // handle Height and Top
        if (event.period.from.date != pDate) {
          if (event.period.to.date != pDate) {
            EventHeight = calculateTimeDifferenceInHours("00:00", "23:59") * gOneHourHeight;
            EventType = "end-end";
          }else {
            EventHeight = calculateTimeDifferenceInHours("00:00", event.period.to.time || event.period.from.time) * gOneHourHeight;
            EventType = "end-start";
          }
          EventTop = 0;
        }

        // multy day
        if (event.period.from.date != event.period.to.date && event.period.to.date) {
          if (pDate == event.period.from.date && !event.period.to.date) {
            EventType = "start-end";
            EventHeight = calculateTimeDifferenceInHours(event.period.from.time, event.period.from.time) * gOneHourHeight;
          }
          else if (pDate != event.period.from.date && pDate != event.period.to.date) {
            EventType = "end-end";
            EventHeight = calculateTimeDifferenceInHours("00:00", "23:59") * gOneHourHeight;
            EventTop = 0;
          }else if (pDate == event.period.from.date && pDate != event.period.to.date && event.period.to.date) {
            EventType = "start-end";
            EventHeight = calculateTimeDifferenceInHours(event.period.from.time, "23:59") * gOneHourHeight;
          }
          else if (pDate != event.period.from.date && pDate == event.period.to.date && event.period.to.date) {
            EventType = event.period.to.time ? "end-start" : "end-end";
            EventHeight = calculateTimeDifferenceInHours("00:00", event.period.to.time || "00:30") * gOneHourHeight;
            EventTop = 0;
          }
        }

        // Handle Over Lapping and Width
        (function handleOverLapping() {
          const overLappingEvents = filterEventsByPeriod(dateEvents, event);
          const allOverLappingItems = [...overLappingEvents, event];

          allOverLappingItems.forEach((overLappingEvent) => {
            if (overLappingEvent.attributs.overlapping) {
              canNoteOverLappingEvent = overLappingEvent;
            }
          });

          if (canNoteOverLappingEvent) {
            return;
          }

          if (overLappingEvents.length) {
            EventWidth = 100 / (parseInt(overLappingEvents.length)+1);
            EventLeft = EventWidth * leftIndex;
            leftIndex++;
          }

          // reset for new overlapping items
          if (leftIndex > overLappingEvents.length) {
            leftIndex = 0;
          }
        })();

        const { breakHeight, breakStart } = calculateBreaks(event.breaks[0], pDate, event.period, EventTop);
        
        chips.push(<PeriodEventChip breakHeight={breakHeight} breakStart={breakStart} key={event.id+index} height={EventHeight} top={EventTop} left={EventLeft} color={getEventColor(event)} title={event.name} type={EventType} width={EventWidth} id={event.id} moveEventChipHandler={onStartMoveEvent} pEvent={event} />);
      });

      return chips;
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
      gPNEventsContainerPeriodLayout.current.style.gridTemplateColumns = `repeat(${gDateRange.length}, 1fr)`;

      const newChips = gDateRange.map((date, dateIndex) => (
        <div
          key={"veranstaltungen-chips-" + dateIndex}
          onMouseOver={() => handleMoveDrageEvent(dateIndex)}
          className="p-n-col"
        ></div>
      ));

      setVeranstaltungenChipsContainer([...newChips]);
      createVeranstaltungChips(newChips);
    }

    function createVeranstaltungChips(pVeranstaltungenChipsContainer) {
      const chips = [];
      let periodEvents = null;

      if (state.targetDisplayEventID) {
        periodEvents = filterEventsBetweenDates(filterEventsByEventId(eventList, new URLSearchParams(location.search).get('vid')), state.periodDate.from, state.periodDate.to);
      }else {
        periodEvents = filterEventsBetweenDates(eventList, state.periodDate.from, state.periodDate.to);
      }
      
      // render end-start and end-end events
      periodEvents.forEach((eventItem, Eindex) => {
        if (eventItem.type == "event") {
          if (eventItem.period.from.date < DateRange[0] && eventItem.period.to.date > DateRange[0]) {
            let currentLong = calculateDateDifference(DateRange[0], (eventItem.period.to.date < DateRange[DateRange.length-1] ? eventItem.period.to.date : DateRange[DateRange.length-1] ));
            let type = "end-start";
            if (eventItem.period.to.date > DateRange[DateRange.length-1]) {
              type = "end-end";
            }

            chips.push(
              <MonthEventChip
                key={eventItem.id+Eindex+"__"}
                id={eventItem.id}
                width={100 * (currentLong + 1)}
                color={getEventColor(eventItem)}
                title={eventItem.name}
                type={type}
                pEvent={eventItem}
                eventItem={true}
                onMouseDown={onStartMovePN}
              />
            );

            setVeranstaltungenChipsContainer(prevEventsContainer => {
              const updatedCells = [...prevEventsContainer];

              for (let index = 1; index <= currentLong; index++) {
                if (updatedCells[index]) {
                  updatedCells[index] = React.cloneElement(
                    updatedCells[index],
                    { key: updatedCells[index]?.key },
                    <> {updatedCells[0]?.props.children} {<div className="m-layout-empt-chip-container"></div>} </> 
                  );
                }            
              }

              if (updatedCells[0]) {
                updatedCells[0] = React.cloneElement(
                  updatedCells[0],
                  { key: updatedCells[0]?.key },
                  <> {updatedCells[0]?.props.children} {chips} </>
                );  
              }
              return updatedCells;
            });

          }
        }
      });

      // render start-start and start-end events
      pVeranstaltungenChipsContainer.forEach((EventContainer, dateIndex) => {
        const cuurentDate = gDateRange[dateIndex];
        const dateVeranstaltungen = periodEvents.filter(item => item.period.from.date == cuurentDate && item.type == "event");
        const chips = [];
        let currentLong = 0;

        dateVeranstaltungen.forEach((veranstaltung, index) => {
          const dateFrom    = veranstaltung.period.from.date;
          const dateTo      = veranstaltung.period.to.date || veranstaltung.period.from.date;
          currentLong       = calculateDateDifference( dateFrom > gDateRange[0] ? dateFrom : gDateRange[0], dateTo < gDateRange[gDateRange.length-1] ? dateTo : gDateRange[gDateRange.length-1] );
          let type = "start-start";

          if (dateTo > gDateRange[gDateRange.length-1] && dateFrom > gDateRange[0]) {
            type = "start-end";
          } else if(dateFrom < gDateRange[0] && dateTo < gDateRange[gDateRange.length-1]) {
            type = "end-start";
          }else if(dateFrom < gDateRange[0] && dateTo > gDateRange[gDateRange.length-1]) {
            type = "end-end";
          }

          chips.push(
            <MonthEventChip
              key={veranstaltung.id+index+dateIndex}
              id={veranstaltung.id}
              width={100 * (currentLong + 1)}
              color={getEventColor(veranstaltung)}
              title={veranstaltung.name}
              type={type}
              pEvent={veranstaltung}
              isVeranstaltung={true}
              onMouseDown={onStartMovePN}
            />
          );
        });

        setVeranstaltungenChipsContainer(prevEventsContainer => {
          const updatedCells = [...prevEventsContainer];

          for (let index = dateIndex+1; index <= dateIndex+currentLong; index++) {
            if (updatedCells[index]) {
              updatedCells[index] = React.cloneElement(
                updatedCells[index],
                { key: updatedCells[index]?.key },
                <> {updatedCells[dateIndex]?.props.children} {<div className="m-layout-empt-chip-container"></div>} </> 
              );
            }            
          }

          if (updatedCells[dateIndex]) {
            updatedCells[dateIndex] = React.cloneElement(
              updatedCells[dateIndex],
              { key: updatedCells[dateIndex]?.key },
              <> {updatedCells[dateIndex]?.props.children} {chips} </>
            );  
          }

          return updatedCells;
        });
      });
    }

    function overLappingPreventerCheck(pEventID) {
      const targetEvent = eventList.filter(event => event.id === pEventID[0]);
      
    }

    /*******************************************************************************************/
    /**
     * ------------------------
     * [ Events Moving Logiks ]
     * ------------------------
     */
    /*******************************************************************************************/

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

      gCalenderbodyperiodlayoutWrapper.current.addEventListener("mousemove", boundHandlers.move);
      gCalenderbodyperiodlayoutWrapper.current.addEventListener("touchmove", boundHandlers.move);
      document.addEventListener("mouseup", boundHandlers.end);
      document.addEventListener("touchend", boundHandlers.end);

      if (isBottomExpansion || isTopExpansion) {
        document.body.style.cursor = 'n-resize';
      }else {
        document.body.style.cursor = 'grab';
      }
    }

    function handleMoveEvent(pIsBottomExpansion, pIsTopExpansion, pEvent) {
      let currentY  = pEvent.clientY;
      let currentX  = pEvent.clientX;
      let diffInDay = (moveOverIndex.current - initMoveColumnIndex) * (60*24);
      let diffInMin = (currentY - initCoords.y) + diffInDay;

      diffInMin     = Math.round(diffInMin / minuteInterval) * minuteInterval;

      if (Math.abs(diffInMin - lastDiffInMin) >= minuteInterval) {
        const period = initMovedEventData.period;
        const breaks = initMovedEventData.breaks;
        const newData = adjustDates(period.from.date, period.from.time, (period.to.date || period.from.date), (period.to.time || period.from.time), diffInMin);
        const breakNewData = [];
        breaks?.forEach(breakData => {
          breakNewData.push(adjustDates(breakData.from.date, breakData.from.time, breakData.to.date, breakData.to.time, diffInMin));
        });
        updateMovedEvent(newData, initMovedEventData.id, pIsBottomExpansion, pIsTopExpansion, breakNewData);
        lastDiffInMin = diffInMin;
      }

      moveToolTipp(currentY, currentX);
    }

    function handleMoveEnd(pEvent) {
      gCalenderbodyperiodlayoutWrapper.current.removeEventListener("mousemove", boundHandlers.move);
      gCalenderbodyperiodlayoutWrapper.current.removeEventListener("touchmove", boundHandlers.move);
      document.removeEventListener("mouseup", boundHandlers.end);
      document.removeEventListener("touchend", boundHandlers.end);
    
      let currentX = pEvent.clientX;
      let currentY = pEvent.clientY;
    
      boundHandlers.move = null;
      boundHandlers.end = null;
      setToolTipData(null);
    
      document.body.style.cursor = 'auto';
    
      if (Math.abs(currentX - initCoords.x) >= 10 || Math.abs(currentY - initCoords.y) >= 5) {
        setState(prevState => ({
          ...prevState,
          eventsChanged: true
        }));
      }

      initCoords.x = 0;
      initCoords.y = 0;
      isMovingEventModeRef.current = false;
    }

    function updateMovedEvent(pNewData, pEventId, pIsBottomExpansion, pIsTopExpansion, pBreakNewData) {
      const targetEvent = eventList.filter(item=> item.id == pEventId)[0];

      if(!pIsBottomExpansion && !pIsTopExpansion){
        targetEvent.period.from.time = pNewData.newStartDate.time;
        targetEvent.period.from.date = pNewData.newStartDate.date;

        if (targetEvent.period.to.date) { targetEvent.period.to.date   = pNewData.newEndDate.date; }
        if (targetEvent.period.to.time) { targetEvent.period.to.time   = pNewData.newEndDate.time; }
      }else if (pIsBottomExpansion) {
        if (initMovedEventData.period.from.date > pNewData.newEndDate.date) {
          return
        }
        if ((initMovedEventData.period.from.time < pNewData.newEndDate.time && pIsBottomExpansion) || initMovedEventData.period.from.date != pNewData.newEndDate.date) {
          if (targetEvent.period.to.time) { targetEvent.period.to.time = pNewData.newEndDate.time; }
          if (targetEvent.period.to.date) { targetEvent.period.to.date = pNewData.newEndDate.date; }
        }
      }else if (pIsTopExpansion) {
        if (initMovedEventData.period.from.date < changeDateByDays(pNewData.newStartDate.date, -1)) {
          return
        }
        if ((initMovedEventData.period.to.time > pNewData.newStartDate.time && pIsTopExpansion) || initMovedEventData.period.to.date != pNewData.newStartDate.date ) {
          targetEvent.period.from.time = pNewData.newStartDate.time;
          targetEvent.period.from.date = pNewData.newStartDate.date;
        }
      }

      if(!pIsBottomExpansion && !pIsTopExpansion) {
        targetEvent.breaks.forEach((targetBreak, index) => {
          targetBreak.from.date = pBreakNewData[index].newStartDate.date;
          targetBreak.from.time = pBreakNewData[index].newStartDate.time;
          targetBreak.to.date = pBreakNewData[index].newEndDate.date;
          targetBreak.to.time = pBreakNewData[index].newEndDate.time;
        });
      }

      setEventList([...eventList]);
      setToolTipData(pNewData);
    }

    let handleMovePNListener;

    function onStartMovePN(pEvent) {
      const start = moveOverIndex.current;
    
      handleMovePNListener = (event) => handleMovePN(start, pEvent, event);
    
      document.addEventListener("mousemove", handleMovePNListener);
      document.addEventListener("mouseup", handleMovePNEnd);
    
      document.querySelectorAll(".m-layout-cell-chip-container").forEach(item => item.style.pointerEvents = "none");

      initPNPeriod = JSON.parse(JSON.stringify(pEvent.period));
    }

    function handleMovePN(start, pEvent) {
      const diffInDay = moveOverIndex.current - start;
      const targetEvent = eventList.filter(item=> item.id == pEvent.id)[0];

      targetEvent.period.from.date = changeDateByDays(initPNPeriod.from.date, diffInDay);
      targetEvent.period.to.date = changeDateByDays(initPNPeriod.to.date, diffInDay);

      setEventList([...eventList]);
    }

    function handleMovePNEnd() {
      document.querySelectorAll(".m-layout-cell-chip-container").forEach(item => item.style.pointerEvents = "all");
      document.removeEventListener("mousemove", handleMovePNListener);
      document.removeEventListener("mouseup", handleMovePNEnd);
    }

    function moveToolTipp(currentY, currentX) {
      if (toolTip.current) { 
        toolTip.current.style.top  = currentY+15+"px";
        toolTip.current.style.left = currentX-115+"px";
      }
    }
  
    return (
      <div className="clalender-period-layout layouts" id="clalender-period-layout">

        { tooltipData ? <Box className="fixed top-0 left-0 bg-[var(--primary)] rounded-md !pointer-events-none" sx={{width: 230, padding: 1.1, zIndex: 99999}} ref={toolTip}>
          <div className="flex justify-between items-center w-full mb-2">
            <div className="flex items-center">
              <Icons.time color={"#fff"} size={14} />
              <p style={{fontSize: 12, marginInlineStart: 4}}> {tooltipData.newStartDate.time} </p>
            </div>

            <div className="flex items-center">
              <Icons.time color={"#fff"} size={14} />
              <p style={{fontSize: 12, marginInlineStart: 4}}>{tooltipData.newEndDate.time}</p>
            </div>
          </div>

          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <Icons.date color={"#fff"} size={14} />
              <p style={{fontSize: 12, marginInlineStart: 4}}>{tooltipData.newStartDate.date}</p>
            </div>

            <div className="flex items-center">
              <Icons.date color={"#fff"} size={14} />
              <p style={{fontSize: 12, marginInlineStart: 4}}>{tooltipData.newEndDate.date}</p>
            </div>
          </div>
        </Box> : <></>}

        <SelectRangeSection
          state={state}
          inputsValues={inputsValues}
          setInputsValues={setInputsValues}
          changeSelectedDateRang={changeSelectedDateRang}
        />
        <CalendarBodySection
          veranstaltungenChipsContainer={veranstaltungenChipsContainer}
          state={state}
          calenderHeader={calenderHeader}
          layoutBody={layoutBody}
          hours={hours}
          gCalenderbodyperiodlayoutWrapper={gCalenderbodyperiodlayoutWrapper}
          gPNEventsContainerPeriodLayout={gPNEventsContainerPeriodLayout}
        />
      </div>
    );
}

function SelectRangeSection({ state, inputsValues, setInputsValues, changeSelectedDateRang }) {
  return (
    <div className={`period-layout-select-range-wrapper d-flex flex-col aic ${state.periodDate?.from ? "hide" : ""}`} id="period-layout-select-range-wrapper">
      <p className="select-range-p">Bitte wählen Sie Ihren gewünschten Zeitraum</p>
      <div className="period-layout-range-pickers d-flex jcc aic">
        <div className="period-layout-range-picker d-flex">
          <span style={{ marginInlineEnd: "10px" }}>von:</span>
          <input
            className="primary-time-input-outlined"
            type="date"
            id="date-rang-f-select-input"
            onChange={(e) => setInputsValues({ ...inputsValues, from: e.target.value })}
          />
        </div>
        <div className="period-layout-range-picker d-flex">
          <span style={{ marginInlineEnd: "10px" }}>bis:</span>
          <input
            className="primary-time-input-outlined"
            type="date"
            id="date-rang-t-select-input"
            onChange={(e) => setInputsValues({ ...inputsValues, to: e.target.value })}
          />
        </div>
      </div>
      <MyButton onClick={changeSelectedDateRang}> Kalender erstellen </MyButton>
    </div>
  );
}

function CalendarHeaderSection({ calenderHeader }) {
  return (
    <div className="calender-header d-flex aic jcb">
      {calenderHeader}
    </div>
  );
}

function TimeList({ hours }) {
  return (
    <div className="timelist" id="timelist">
      {hours.map((hour, index) => (
        <div key={"ssfwwrrww_" + index} className="hour-row-head d-flex jcc">
          <span style={{ backgroundColor: "var(--bg)", height: "max-content" }}>
            {hour.toString().padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}

function CalendarTableBody({ layoutBody, hours, gCalenderbodyperiodlayoutWrapper }) {
  return (
    <div className="calender-body-day-layout-wrapper hide-scrollbar" ref={gCalenderbodyperiodlayoutWrapper} >
      <div className="time-line" id="time-line" />
      <div className="calender-body">
        <div className="period-layout-events-container d-flex" id="period-layout-events-container">
          {layoutBody}
        </div>
        {hours.map((hour, index) => (
          <div key={hour + index + "_"} className="calender-day-layout-hour-row d-flex aic">
            <div className="hour-row-body">
              <div className="hour-row-half">
                <div className="hour-row-quarter" />
                <div className="hour-row-quarter" />
              </div>
              <div className="hour-row-half">
                <div className="hour-row-quarter" />
                <div className="hour-row-quarter" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarBodySection({ state, calenderHeader, layoutBody, hours, gCalenderbodyperiodlayoutWrapper, gPNEventsContainerPeriodLayout, veranstaltungenChipsContainer }) {
  return (
    <div className={`period-layout-wrapper ${state.periodDate?.from ? "" : "hide"}`} id="period-layout-wrapper">
      <div className="period-header-elements">
        <CalendarHeaderSection calenderHeader={calenderHeader} />
        <div className="p-n-events-container p-n-p-l flex items-center" ref={gPNEventsContainerPeriodLayout}>
          {veranstaltungenChipsContainer}
        </div>
      </div>
      <div style={{ width: "max-content", height: "calc(100vh - 240px)" }} className="d-flex">
        <TimeList hours={hours} />
        <CalendarTableBody layoutBody={layoutBody} hours={hours} gCalenderbodyperiodlayoutWrapper={gCalenderbodyperiodlayoutWrapper} />
      </div>
    </div>
  );
}
