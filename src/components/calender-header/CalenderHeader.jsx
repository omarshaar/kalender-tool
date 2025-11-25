import React from 'react';
import { Box } from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import Icons from "../../assetes/Icons";
import { DropMenu, MyButton, MyInput, MyText } from "../";
import { changeDateByDays, convertDateToReadableFormat, getTodayDate, getWeekStartAndEnd } from "../../ultis/dates";
import { MainContext } from "../../context";
import { EventsContext } from '../../context/events';

export default function CalenderHeader() {
  const datePicker = useRef(null);
  const { state, setState, dateChanger } = useContext(MainContext);
  const { eventsState, handleSaveChanges } = useContext(EventsContext);
  const [date, setDate] = useState(convertDateToReadableFormat(state.selectedDate, state.selectedLayout));
  const [openSettingMenu, setOpenSettingMenu] = useState(false);

  useEffect(() => {
    setDate(convertDateToReadableFormat(state.selectedDate, state.selectedLayout));
  }, [state.selectedDate, state.selectedLayout]);

  useEffect(()=> {
    setTimeout(() => { getSetting() }, 10);
  },[]);

  function onChangeNext() {
    dateChanger('date-next');
  }

  function onChangePrev() {
    dateChanger('date-prev');
  }

  function openDatePicker() {
    datePicker.current.showPicker();
  }

  function onChangeDatePicker() {
    dateChanger('date-set', datePicker.current.value);
  }

  function changeLayout(pLayout) {
    setState(prevState => ({
      ...prevState,
      selectedLayout: pLayout,
    }));
    localStorage.setItem("layout", pLayout);
  }

  function handleChangeToTodayDate() {
    if (state.selectedLayout == "period-layout") {
      const weekPeriod = getWeekStartAndEnd(getTodayDate());
      setState((prevState) => ({
        ...prevState,
        periodDate: {
          ...prevState.periodDate,
          from: weekPeriod.start,
          to: weekPeriod.end
        }
      }));
      localStorage.setItem("periodDateFrom", weekPeriod.start);
      localStorage.setItem("periodDateTo", weekPeriod.end);
    } else {
      dateChanger('date-set', getTodayDate());
    }
  }

  function createSelectEventOptions() {
    const events  = eventsState.eventsList.filter(event => event.type == "event");
    const options = [];

    events.forEach(eventItem => {
      options.push(<option key={eventItem.id+"_option_"} value={eventItem.id}>{eventItem.name}</option>)
    });

    return options;
  }

  function onSelectedEventChange(pID) {
    const url = new URL(window.location.href);

    if (pID !== "0") {
      url.searchParams.set('vid', pID);
      setState(prevState => ({
        ...prevState,
        targetDisplayEventID: pID
    }));
    }else {
      url.searchParams.delete('vid');
      setState(prevState => ({
        ...prevState,
        targetDisplayEventID: null
      }));
    }
    
    window.history.replaceState({}, '', url);
  }

  function getSelectedIDValueFromULR() {
    let v = new URLSearchParams(location.search).get('vid');
    if (v) {
      return v;
    }else {
      return "0"
    }
  }

  function setLeerTage(pEvent) {
    setState(prevState => ({ ...prevState, hiddenEmptyDays: pEvent.target.checked}));
    
    const setting = localStorage.getItem("kalender_user_setting");
    if (!setting) {
      localStorage.setItem("kalender_user_setting", JSON.stringify({
        hiddenEmptyDays_locstor: pEvent.target.checked
      }));
    }else {
      const _setting = (JSON.parse(setting));
      _setting.hiddenEmptyDays_locstor = pEvent.target.checked;
      localStorage.setItem("kalender_user_setting", JSON.stringify(_setting));
    }
  }

  function setPeriodOnEventRange(pEvent) {
    if (pEvent) {
      setState(prevState => ({ ...prevState, displayOnEventTimeRange: pEvent.target.checked}));
    }else {
      setState(prevState => ({ ...prevState, displayOnEventTimeRange: true}));
    }

    const setting = localStorage.getItem("kalender_user_setting");
    if (!setting) {
      localStorage.setItem("kalender_user_setting", JSON.stringify({
        displayOnEventTimeRange_locstor: pEvent ? pEvent.target.checked : true
      }));
    }else {
      const _setting = (JSON.parse(setting));
      _setting.displayOnEventTimeRange_locstor = pEvent ? pEvent.target.checked : true;
      localStorage.setItem("kalender_user_setting", JSON.stringify(_setting));
    }
  }

  function getSetting() {
    const setting = localStorage.getItem("kalender_user_setting");
    if (setting) {
      const _setting = JSON.parse(setting);
      setState(prevState => ({
        ...prevState,
        displayOnEventTimeRange: _setting.displayOnEventTimeRange_locstor || false,
        hiddenEmptyDays: _setting.hiddenEmptyDays_locstor || false
      }));
    }
  }

  return (
    <Box className="w-full border-t border-b py-2 border-[var(--secondary-opacity)] flex justify-between items-center mb-3 relative z-[8888]">
      <Box className="flex items-center justify-between">
        <MyButton onClick={handleChangeToTodayDate} className={"me-2"}>{state.selectedLayout == "period-layout" ? "Dise Woche" : "Heute"}</MyButton>
        {
          state.selectedLayout != "period-layout" 
          ? <DateChanger date={date} datePicker={datePicker} onNext={onChangeNext} onPrev={onChangePrev} openDatePicker={openDatePicker} onChangeDatePicker={onChangeDatePicker} /> 
          : <DateChangerPeriod />
        }
      </Box>

      <Box className="flex items-center justify-between">
        { state.eventsChanged ? <MyButton onClick={handleSaveChanges} style={{marginInlineEnd: 10, background: "#29e34a"}} > <Icons.save className={"stroke-black"} size={20} /> </MyButton> : <></> }
        <MyButton onClick={() => setState({...state, openDialogs: {...state.openDialogs, addEventDialog: true}})} > <Icons.plus className={"stroke-black"} size={19} /> </MyButton>
        <div className="d-flex aic" style={{ marginInlineStart: 10 }}>
          <div className="calender-layout-type-btns d-flex aic">
            <div onClick={() => changeLayout("month-layout")} className={`calender-layout-type-btn-item d-flex jcc aic ${state.selectedLayout == 'month-layout' ? 'calender-layout-type-btn-item-active' : ''}`} id="month-layout-btn"><span className="text-black dark:text-darkWhite">Monat</span></div>
            <div onClick={() => changeLayout("day-layout")} className={`calender-layout-type-btn-item d-flex jcc aic ${state.selectedLayout == 'day-layout' ? 'calender-layout-type-btn-item-active' : ''}`} id="day-layout-btn"><span className="text-black dark:text-darkWhite">Tag</span></div>
            <div onClick={() => changeLayout("period-layout")} className={`calender-layout-type-btn-item d-flex jcc aic ${state.selectedLayout == 'period-layout' ? 'calender-layout-type-btn-item-active' : ''}`} id="period-layout-btn"><span className="text-black dark:text-darkWhite">Zeitraum</span></div>
          </div>
        </div>

        <Box className="relative">
          <DropMenu open={openSettingMenu} setOpen={setOpenSettingMenu} >
            <Box className="w-full p-2 flex justify-between items-center" sx={{borderBottom: "1px #ddd solid"}} >
              <label htmlFor="lertgablid" style={{fontSize: 14}}>Leere Tage ausblenden</label>
              <input type="checkbox" checked={state.hiddenEmptyDays} id='lertgablid' onChange={setLeerTage} />
            </Box>
            <Box className="w-full p-2 pb-0 flex justify-between items-center" sx={{borderBottom: "1px #ddd solid"}} >
              <label htmlFor="lertgablidagrt" style={{fontSize: 14}}> Zeitraum an Veranstaltungsgrenzen anpassen </label>
              <input type="checkbox" id='lertgablidagrt' checked={state.displayOnEventTimeRange} onChange={setPeriodOnEventRange} />
            </Box>

            <Box className="w-full p-2 pb-0 flex flex-col" sx={{borderBottom: "0px #ddd solid"}} >
              <label htmlFor="seecevbents" style={{fontSize: 14, marginBottom: 4}}> Veranstaltung </label>
              <select value={getSelectedIDValueFromULR()} className='p-1 outline-none' name="" id="seecevbents" onChange={(e)=> onSelectedEventChange(e.target.value)}> <option value="0">Alle</option> {createSelectEventOptions()} </select>
            </Box>
          </DropMenu>
          <Box onClick={() => setOpenSettingMenu(true)} sx={{ marginInlineStart: 1 }} className="icon-btn relative z-50"> <Icons.settings className={"dark:stroke-darkWhite stroke-black"} size={24} /></Box>
        </Box>
      </Box>
    </Box>
  );
}

function DateChanger({ onNext, onPrev, datePicker, openDatePicker, onChangeDatePicker, date }) {
  return (
    <Box className="flex items-center justify-between">
      <Box onClick={onPrev} className="icon-btn"><Icons.chevronLeft size="24" className={"dark:stroke-darkWhite stroke-black"} strokeWidth={2.5} /></Box>
      <Box onClick={openDatePicker} className="relative cursor-pointer"><MyText className={"mx-1"}>{date}</MyText> <MyInput onChange={onChangeDatePicker} type={"date"} className={"w-20"} ref={datePicker} /></Box>
      <Box onClick={onNext} className="icon-btn"><Icons.chevronRight size="24" className={"dark:stroke-darkWhite stroke-black"} strokeWidth={2.5} /></Box>
    </Box>
  );
}

function DateChangerPeriod() {
  const fromInput = useRef(null);
  const toInput = useRef(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const {state, setState} = useContext(MainContext);

  useEffect(() => {
    showDatePeriod();
  }, [state.periodDate, state.selectedLayout]);

  function openToDatePicker() {
    toInput.current.showPicker();
  }

  function openFromDatePicker() {
    fromInput.current.showPicker();
  }

  function showDatePeriod() {
    setFromDate(convertDateToReadableFormat(state.periodDate.from));
    setToDate(convertDateToReadableFormat(state.periodDate.to));
  }

  function onChangeFromDate(pValue) {
    setState(prevState => ({
      ...prevState,
      periodDate: {
        ...prevState.periodDate,
        from: pValue,
      },
    }));

    localStorage.setItem("periodDateFrom", pValue);
  }

  function onChangeToDate(pValue) {
    setState(prevState => ({
      ...prevState,
      periodDate: {
        ...prevState.periodDate,
        to: pValue,
      },
    }));
    localStorage.setItem("periodDateTo", pValue);
  }

  function changeDateRange(pOperation, pType) {
    setState(prevState => {
      let dateValue;
      let gDateRange = prevState.dateRange;
  
      if (pOperation === "+") {
        if (pType === "from") {
          dateValue = changeDateByDays(gDateRange[0], -1);
          return {
            ...prevState,
            periodDate: {
              ...prevState.periodDate,
              from: dateValue,
            },
          };
        } else if (pType === "to") {
          dateValue = changeDateByDays(gDateRange[gDateRange.length - 1], 1);
          return {
            ...prevState,
            periodDate: {
              ...prevState.periodDate,
              to: dateValue,
            },
          };
        }
      } else if (pOperation === "-") {
        if (gDateRange.length <= 1) {
          return prevState;
        }
        if (pType === "from") {
          dateValue = changeDateByDays(gDateRange[0], 1);
          return {
            ...prevState,
            periodDate: {
              ...prevState.periodDate,
              from: dateValue,
            },
          };
        } else if (pType === "to") {
          dateValue = changeDateByDays(gDateRange[gDateRange.length - 1], -1);
          return {
            ...prevState,
            periodDate: {
              ...prevState.periodDate,
              to: dateValue,
            },
          };
        }
      }
      return prevState;
    });
  }

  return (
    <div id="c-h-a-c-pl" className="d-flex aic">
      <div className="todays-date-container d-flex aic">
        <button className="controler-btns" onClick={() => changeDateRange('-', 'from')}><Icons.minus className="stroke-darkWhite" /></button>
        <p onClick={openFromDatePicker}> {fromDate} </p>
        <button className="controler-btns" onClick={() => changeDateRange('+', 'from')}><Icons.plus className="stroke-darkWhite" /></button>
        <input ref={fromInput} onChange={(event) => onChangeFromDate(event.target.value)} type="date" id="select-from-date-picker" className="select-date-picker" />
      </div>
      
      <div className="virtical-divider"></div>
      
      <div className="todays-date-container d-flex aic">
        <button className="controler-btns" onClick={() => changeDateRange('-', 'to')}><Icons.minus className="stroke-darkWhite" /></button>
        <p onClick={openToDatePicker}> {toDate} </p>
        <button className="controler-btns" onClick={() => changeDateRange('+', 'to')}><Icons.plus className="stroke-darkWhite" /></button>
        <input ref={toInput} onChange={(event) => onChangeToDate(event.target.value)} type="date" id="select-to-date-picker" className="select-date-picker" />
      </div>
    </div>
  );
}
