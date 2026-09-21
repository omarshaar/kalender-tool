/**
 * @file Events data layer for the calendar: the "staging + explicit commit" store.
 *
 * Business model:
 * - An event is either an `"event"` ("Veranstaltung" — a top-level happening) or a
 *   `"programm"` ("Programmpunkt" — a sub-item linked to a Veranstaltung via `targetEventId`).
 * - Nothing is written to `localStorage` as soon as the user adds/edits/deletes an event.
 *   Changes are staged in React state and only committed on an explicit "save":
 *     - `eventsState.eventsList` — events already persisted (loaded from `localStorage`).
 *     - `eventsState.newEvents`  — not-yet-persisted drafts, created via the "add event" dialog
 *       or by dragging on the period layout.
 *     - `event.deleteMarked`     — soft-delete flag; the event stays visible (in a warning
 *       color) until the pending changes are actually saved.
 * - `state.eventsChanged` (from `MainContext`) is the single source of truth for "there are
 *   unsaved changes"; it drives the save button in the header and the unload warning below.
 *
 * Actual persistence only happens in {@link EventsProvider.saveToLocalHost}, called from
 * {@link EventsProvider.handleSaveChanges} when the user presses the save button.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { MainContext } from '.';

/** React context exposing the events store; consume via `useContext(EventsContext)`. */
export const EventsContext = createContext();

/**
 * Provides the events store (`eventsState`) and the actions to read/stage/commit changes
 * to it. Must be mounted under `MainProvider`, since it reads/writes shared UI state
 * (`state.eventsChanged`, `state.openDialogs`, `state.onSwipeEventID`) from `MainContext`.
 */
export const EventsProvider = ({ children }) => {
  const {state, setState} = useContext(MainContext);

  /**
   * @property {Array<Object>} eventsList - Events already persisted in `localStorage`.
   * @property {Array<Object>} newEvents - Draft events not yet persisted (staged).
   * @property {Array<Object>} removedEvents - Reserved for future use; currently unused.
   * @property {Array<Object>} updatedEvents - Reserved for future use; currently unused.
   */
  const [eventsState, setEventsState] = useState({
    eventsList: [],
    newEvents: [],
    removedEvents: [],
    updatedEvents: []
  });

  // Load whatever was previously saved as soon as the provider mounts.
  useEffect(() => {
    getEvents();
  }, []);

  // A draft event created by dragging on the period layout ("on-swipe creation") opens the
  // add-event dialog right away. If the user closes that dialog without saving, the draft
  // (identified by `state.onSwipeEventID`) must be discarded instead of lingering in `newEvents`.
  useEffect(()=> {
    if (!state.openDialogs.addEventDialog && state.onSwipeEventID) {
      resetNewEventsLastItem();
    }
  },[state.openDialogs.addEventDialog, state.onSwipeEventID]);

  // Warn the user with the browser's native "unsaved changes" prompt before they navigate
  // away or reload with pending (not-yet-committed) changes, since nothing in `newEvents`
  // or `deleteMarked` is persisted to `localStorage` until an explicit save.
  useEffect(() => {
    if (!state.eventsChanged) {
      return;
    }

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.eventsChanged]);

  /**
   * Commits all pending changes to `localStorage` and clears the "unsaved changes" flag.
   * Bound to the save button shown in the header while `state.eventsChanged` is true.
   */
  function handleSaveChanges() {
    if (saveToLocalHost()) {
      setState(prevState => ({
        ...prevState,
        eventsChanged: false
      }));
    }
  }

  /**
   * Merges `eventsList` and `newEvents`, drops anything `deleteMarked`, and writes the
   * result to `localStorage` as the new source of truth. This is the only place that
   * actually persists event data.
   *
   * @returns {boolean} Always `true`; kept as a return value so callers can react to
   *   the outcome if persistence is made fallible in the future.
   */
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

  /**
   * Loads the persisted event list from `localStorage` into `eventsState.eventsList`.
   * Falls back to an empty list (with a user-facing alert) if the stored data is missing,
   * corrupted, or not a JSON array, instead of letting the app crash on startup.
   */
  function getEvents() {
    let storedEvents = [];
    try {
      storedEvents = JSON.parse(localStorage.getItem("events") || '[]');
      if (!Array.isArray(storedEvents)) {
        storedEvents = [];
      }
    } catch (error) {
      console.error("Gespeicherte Termine konnten nicht geladen werden, die Daten sind beschädigt.", error);
      window.alert("Die gespeicherten Termine konnten nicht geladen werden (beschädigte Daten). Es wird mit einer leeren Liste gestartet.");
      storedEvents = [];
    }

    setEventsState(prevState => ({
      ...prevState,
      eventsList: storedEvents
    }));
  }

  /**
   * Applies a staged change to the events store and marks it as unsaved: replaces
   * `eventsState` with `pValue`, sets `state.eventsChanged = true`, and closes the
   * add-event dialog. Used by every create/edit/delete flow as the single explicit
   * commit path into React state (persistence itself still only happens on save).
   *
   * @param {Object} pValue - The next `eventsState` (typically `{ ...eventsState, eventsList/newEvents: ... }`).
   */
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

  /** Discards the draft event identified by `state.onSwipeEventID` from `newEvents` (see the cleanup effect above). */
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