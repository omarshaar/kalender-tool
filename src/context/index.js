/**
 * @file Shared UI/navigation state for the calendar: selected date, active layout
 * (month/day/period), open dialogs, and cross-cutting flags like `eventsChanged`.
 *
 * This is the "global" state consumed by every layout and dialog component. It only
 * deals with *what the user is currently looking at / doing* — the actual event data
 * (list of events, drafts, soft-deletes) lives in `EventsContext` (`context/events.js`),
 * which itself reads some of this state (e.g. `eventsChanged`, `openDialogs`).
 *
 * A few fields are restored from `localStorage` on mount (`periodDate`, `selectedLayout`),
 * and `targetDisplayEventID` can be set from a `?vid=` URL query param, letting a link be
 * shared that opens the calendar focused on one specific event.
 */

import React, { createContext, useState, useEffect } from 'react';
import { changeDateByDays, changeDateByMonths, formatDate } from '../ultis/dates';

/** React context exposing the shared calendar UI state; consume via `useContext(MainContext)`. */
export const MainContext = createContext();

/**
 * Provides the shared calendar UI state (`state`) and the actions to navigate it
 * (currently just {@link MainProvider.dateChanger}). Must wrap `EventsProvider`, since
 * the events store reads state from this context.
 */
export const MainProvider = ({ children }) => {
  /**
   * @property {string} selectedDate - Currently viewed date, `"YYYY-MM-DD"`.
   * @property {"month-layout"|"day-layout"|"period-layout"} selectedLayout - Active calendar view.
   * @property {{from: string|null, to: string|null}} periodDate - User-chosen date range for the period layout.
   * @property {Array} calenderEvents - Reserved for future use; currently unused.
   * @property {Array} dateRange - Reserved for future use; currently unused.
   * @property {boolean} eventsChanged - Whether there are unsaved event changes (see `EventsContext`).
   * @property {Object|null} toEditSelectedForm - The event object currently loaded into the add/edit dialog, if any.
   * @property {boolean} hiddenEmptyDays - Whether the period layout hides days with no events.
   * @property {string|null} onSwipeEventID - Id of a draft event created by dragging on the period layout, while its dialog is open.
   * @property {boolean} displayOnEventTimeRange - Whether the period layout is focused around one specific event.
   * @property {string|null} targetDisplayEventID - Id of the event to focus on (from the `?vid=` URL param).
   * @property {Object} openDialogs - Visibility flags for the calendar's dialogs.
   */
  const [state, setState] = useState({
    selectedDate: formatDate(new Date()),
    selectedLayout: "month-layout",
    periodDate: { from: null, to: null },
    calenderEvents: [],
    dateRange: [],
    eventsChanged: false,
    toEditSelectedForm: null,
    newEventDate: null,
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

  // One-time setup on mount: restore the user's last period range/layout, and honor a
  // shared "focus on this event" link if one was passed via the URL.
  useEffect(()=> {
    getPeriodFromLocalStorage();
    getLayoutFromLocalStorage();
    getIFAnySelectedDisplayEventID();
  }, []);

  // Whenever the add/edit dialog closes (save, cancel or delete), clear the event that
  // was loaded into it so the next "add" open starts from a blank form.
  useEffect(()=> {
    if (!state.openDialogs.addEventDialog) {
      setState(prevState => ({
        ...prevState,
        toEditSelectedForm: null,
        newEventDate: null,
        openDialogs: {
          ...prevState.openDialogs,
        },
      }));
    }
  },[state.openDialogs.addEventDialog]);

  /**
   * Navigates `selectedDate` for the current layout, or jumps to an explicit date.
   *
   * @param {"date-next"|"date-prev"|"date-set"} pAction - Which navigation to perform.
   * @param {Date} [value] - The target date; only used for `"date-set"`.
   */
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

  /** Restores the user's last-chosen period-layout date range (`periodDate`) from `localStorage`. */
  function getPeriodFromLocalStorage() {
    state.periodDate.from = localStorage.getItem("periodDateFrom");
    state.periodDate.to   = localStorage.getItem("periodDateTo");
    setState({...state});
  }

  /** Restores the user's last-chosen calendar layout (month/day/period) from `localStorage`. */
  function getLayoutFromLocalStorage() {
    state.selectedLayout = localStorage.getItem("layout");
    setState({...state});
  }

  /** Reads the `?vid=` URL query param, if present, so the calendar can focus on that shared event. */
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
