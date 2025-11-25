import { Box, Icon } from "@mui/material";
import React from "react";
import Icons from "../../assetes/Icons";
import { MyButton, MyInput } from "../";

export default function CalenderHeader(props) {
  function dateChanger(action, event) {
    // Function implementation here
  }

  function openDatePicker() {
    // Function implementation here
  }

  function changeDateRange(direction, type) {
    // Function implementation here
  }

  function changePeriodDate(type, event) {
    // Function implementation here
  }

  function openFromDatePicker() {
    // Function implementation here
  }

  function openToDatePicker() {
    // Function implementation here
  }

  function saveEventsHandler() {
    // Function implementation here
  }

  function openDayLayoutModal(action) {
    // Function implementation here
  }

  function changeLayout(layout) {
    // Function implementation here
  }

  function handleOpenSettingsMenu() {
    // Function implementation here
  }

  function handleChangeShowEmptyDays(event) {
    // Function implementation here
  }

  function adjustTimeRangeBasedOnEvent(event) {
    // Function implementation here
  }

  function handleChangeSelectedEvent(event) {
    // Function implementation here
  }

  function resetData() {
    // Function implementation here
  }

  return (
    <div className="calender-wrapper-header d-flex jcb aic">
      <div className="d-flex aic">
        <div id="c-h-a-c" className="d-flex aic">
          <MyButton onClick={() => dateChanger("today")} style={{ padding: "10px", marginInlineEnd: "6px" }}>Heute</MyButton>
    
          <div className="date-nav-btns flex">
            <Box style={{ margin: 0 }} onClick={() => dateChanger("date-prev")}><Icons.chevronLeft size={24} color={"#fff"}/></Box>
            <Box style={{ marginInlineStart: "-4px" }} onClick={() => dateChanger("date-next")}><Icons.chevronRight size={24} color={"#fff"}/></Box>
          </div>

          <div className="todays-date-container">
            <p onClick={openDatePicker} id="day-layout-current-date-p"></p>
            <MyInput onChange={(event) => dateChanger("select-date", event)} type="date" id="select-date-picker" />
          </div>
        </div>

        <div id="c-h-a-c-pl" className="d-flex aic hide">
          <button
            onClick={() => dateChanger("this-week")}
            className="primary-btn"
            style={{ padding: "10px", marginInlineEnd: "6px" }}
          >
            Diese Woche
          </button>
          <div className="todays-date-container d-flex aic">
            <button
              className="controler-btns"
              onClick={() => changeDateRange("-", "from")}
            >
              <Icons.minus size={24} color={"#fff"} />

            </button>
            <p onClick={openFromDatePicker} id="period-layout-from-date-p"></p>
            <button
              className="controler-btns"
              onClick={() => changeDateRange("+", "from")}
            >
              <Icons.plus size={24} color={"#fff"} />
            </button>
            <input
              onChange={(event) => changePeriodDate("from", event)}
              type="date"
              id="select-from-date-picker"
              className="select-date-picker"
            />
          </div>

          <div className="virtical-divider"></div>

          <div className="todays-date-container d-flex aic">
            <button
              className="controler-btns"
              onClick={() => changeDateRange("-", "to")}
            >
              <Icons.minus  size={24} color={"#fff"} />
            </button>
            <p onClick={openToDatePicker} id="period-layout-to-date-p"></p>
            <button
              className="controler-btns"
              onClick={() => changeDateRange("+", "to")}
            >
              <Icons.plus size={24} color={"#fff"} />
            </button>
            <input
              onChange={(event) => changePeriodDate("to", event)}
              type="date"
              id="select-to-date-picker"
              className="select-date-picker"
            />
          </div>
        </div>
      </div>




      <div className="d-flex aic">
        <button
          className="primary-btn hide"
          onClick={saveEventsHandler}
          id="save-events-button"
          style={{ backgroundColor: "var(--danger)", color: "#fff" }}
        >
          <Box style={{ marginInlineEnd: "4px" }}> <Icons.squareRoundCheck size={19} color={"#fff"} /> </Box>
          Änderungen speichern
        </button>

        <button
          className="primary-btn"
          onClick={() => openDayLayoutModal("new")}
          id="create-event-button"
        >
          <Box style={{ marginInlineEnd: "0px" }}><Icons.plus size={19} color={"#000"} /></Box>
        </button>

        <div className="d-flex aic" style={{ marginLeft: "10px" }}>
          <div className="calender-layout-type-btns d-flex aic">
            <div
              className="calender-layout-type-btn-item d-flex jcc aic"
              id="month-layout-btn"
              onClick={() => changeLayout("month-layout")}
            >
              <span>Monat</span>
            </div>
            <div
              className="calender-layout-type-btn-item d-flex jcc aic"
              id="day-layout-btn"
              onClick={() => changeLayout("day-layout")}
            >
              <span>Tag</span>
            </div>
            <div
              className="calender-layout-type-btn-item d-flex jcc aic"
              id="period-layout-btn"
              onClick={() => changeLayout("period-layout")}
            >
              <span>Zeitraum</span>
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <Box sx={{marginX: 1}} onClick={handleOpenSettingsMenu}> <Icons.settings size={24} color={"#fff"} /> </Box>
          <div
            className="drop-menu-container hide sett-drop"
            id="settings-drop-menu-container"
          >
            <div className="serrated"></div>

            <div className="drop-menu-item w-full d-flex jcb aic">
              <p> Leere Tage ausblenden </p>
              <input type="checkbox" onChange={handleChangeShowEmptyDays} />
            </div>

            <div className="drop-menu-item w-full d-flex jcb aic">
              <p> Zeitraum an Veranstaltungsgrenzen anpassen </p>
              <input
                type="checkbox"
                onChange={adjustTimeRangeBasedOnEvent}
                id="event-time-range-checkbox"
              />
            </div>

            <div className="drop-menu-item">
              <p>Veranstaltung</p>
              <select
                style={{ marginTop: 0 }}
                onChange={handleChangeSelectedEvent}
                name="select-enabled-events"
                id="select-enabled-events"
                className="primary-select select-enabled-events"
              ></select>
            </div>

            <div className="drop-menu-item">
              <p>Reset</p>
              <button onClick={resetData}> Reset Data </button>
            </div>
          </div>
        </div>
        <Icons.infoSquareRound size={24} color={"#fff"} />
      </div>
    </div>
  );
}
