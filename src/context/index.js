import React, { createContext, useState, useEffect } from 'react';
import { changeDateByDays, changeDateByMonths, formatDate } from '../ultis/dates';

export const MainContext = createContext();

export const MainProvider = ({ children }) => {
  const [state, setState] = useState({
    selectedDate: formatDate(new Date()),
    selectedLayout: "month-layout",
    periodDate: { from: null, to: null },
    calenderEvents: [],
    dateRange: [],
    eventsChanged: false,
    toEditSelectedForm: null,
    hiddenEmptyDays: false,
    onSwipeEventID: null,
    displayOnEventTimeRange: false,
    targetDisplayEventID: null,
    openDialogs: {
      addEventDialog: false,
      eventEditDialog: false,
      eventDeleteDialog: false,
      isNewEvent: true
    },
  });

  useEffect(()=> {
    getPeriodFromLocalStorage(); 
    getLayoutFromLocalStorage();
    getIFAnySelectedDisplayEventID();
  }, []);

  useEffect(()=> {
    if (!state.openDialogs.addEventDialog) {
      setState(prevState => ({
        ...prevState,
        toEditSelectedForm: null,
        openDialogs: {
          ...prevState.openDialogs,
        },
      }));
    }
  },[state.openDialogs.addEventDialog]);

  function dateChanger(pAction, value) {
      if (pAction == "date-next") {
          switch (state.selectedLayout) {
              case "day-layout": setState({...state, selectedDate: changeDateByDays(state.selectedDate, 1)}); break;
              case "month-layout": setState({...state, selectedDate: changeDateByMonths(state.selectedDate, 1)}); break;
              default: break;
          }
      } else if (pAction == "date-prev") {
          switch (state.selectedLayout) {
              case "day-layout": setState({...state, selectedDate: changeDateByDays(state.selectedDate, -1)}); break;
              case "month-layout": setState({...state, selectedDate: changeDateByMonths(state.selectedDate, -1)}); break;
              default: break;
          }
      } else if(pAction == "date-set") {
          setState({...state, selectedDate: formatDate(value)});
      }
  }

  function getPeriodFromLocalStorage() {
    state.periodDate.from = localStorage.getItem("periodDateFrom");
    state.periodDate.to   = localStorage.getItem("periodDateTo");
    setState({...state});
  }

  function getLayoutFromLocalStorage() {
    state.selectedLayout = localStorage.getItem("layout");
    setState({...state});
  }

  function getIFAnySelectedDisplayEventID() {
    const vid = new URLSearchParams(location.search).get('vid');
    if (vid) {
      setState(prevState => ({
        ...prevState,
        targetDisplayEventID: vid
      }));
    }
  }

  return (
    <MainContext.Provider value={{state, setState, dateChanger}}>
      {children}
    </MainContext.Provider>
  );
};
