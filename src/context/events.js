import React, { createContext, useState, useEffect, useContext } from 'react';
import { changeDateByDays, changeDateByMonths, formatDate } from '../ultis/dates';
import { MainContext } from '.';

export const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
  const {state, setState} = useContext(MainContext);
  const [eventsState, setEventsState] = useState({
    eventsList: [],
    newEvents: [],
    removedEvents: [],
    updatedEvents: []
  });

  useEffect(() => {
    getEvents();
  }, []);
  
  useEffect(()=> {
    if (!state.openDialogs.addEventDialog && state.onSwipeEventID) {
      resetNewEventsLastItem();
    }
  },[state.openDialogs.addEventDialog, state.onSwipeEventID]);
  
  function handleSaveChanges() {
    if (saveToLocalHost()) {
      setState(prevState => ({
        ...prevState,
        eventsChanged: false
      }));
    }
  }

  function saveToLocalHost() {
    const newEvents = [...eventsState.eventsList, ...eventsState.newEvents].filter(event => !event.deleteMarked);
    localStorage.setItem("events", JSON.stringify(newEvents));
    eventsState.newEvents = [];
    eventsState.eventsList = newEvents;
    setEventsState(prevState => ({
      ...prevState,
      eventsList: newEvents,
      newEvents: []
    }));
    return true;
  }

  function getEvents() {
    setEventsState(prevState => ({
      ...prevState,
      eventsList: JSON.parse(localStorage.getItem("events") || '[]')
    }));
  }

  function changeEventListHandler(pValue) {
    setEventsState(pValue);
    setState(prevState => ({
      ...prevState,
      eventsChanged: true,
      openDialogs: {
        ...prevState.openDialogs,
        addEventDialog: false
      }
    }));
  }

  function resetNewEventsLastItem() {
    setEventsState(prevState => ({
      ...prevState,
      newEvents: prevState.newEvents.filter(item => item.id !== state.onSwipeEventID)
    }));
  }

  return (
    <EventsContext.Provider value={{eventsState, setEventsState, handleSaveChanges, changeEventListHandler}}>
      {children}
    </EventsContext.Provider>
  );
};