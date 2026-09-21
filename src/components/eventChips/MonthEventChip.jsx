/**
 * @file Chip used for multi-day/whole-day events: the month grid's event chips, and
 * the "Veranstaltung" (event) header strip in the day/period layouts (`isVeranstaltung`).
 * `type` (a `"<start>-<end>"` key, e.g. `"start-end"`) marks whether each edge is the
 * event's real start/end or just a continuation across a row/day boundary.
 */

import { useContext } from "react";
import { MainContext } from "../../context";

export default function MonthEventChip({ id, width, color, title, type, onMouseDown, onMouseUp, pEvent, isVeranstaltung, onDoubleClick }) {
  const chipContainerId = `chip-container-${id}`;
  const { state, setState, dateChanger } = useContext(MainContext);

  /** Opens the add/edit dialog on double-click, loaded with this chip's event. */
  function openEventDialog() {
    setState(prevState => ({
      ...prevState,
      toEditSelectedForm: pEvent,
      openDialogs: {
        ...prevState.openDialogs,
        addEventDialog: true
      }
    }));
    
    if (onDoubleClick) {
      onDoubleClick()
    }
  }

  return (
    <div onDoubleClick={openEventDialog}>
      <div className="m-layout-cell-chip-container" style={{ width: `calc(${width}% + ${ isVeranstaltung ? 0 : ((width/100)-1)*8}px)`}} 
        onTouchStart={onMouseDown ? () => onMouseDown(pEvent) : () => {}} 
        onMouseDown={onMouseDown ? () => onMouseDown(pEvent) : () => {}} 
        onMouseUp={onMouseUp ? onMouseUp : () => {}}
        onTouchEnd={onMouseUp ? onMouseUp : () => {}}
      >
        <div
          className={`m-layout-cell-chip flex justify-start items-center container-group-id-${id} ${type ? type + "-chip" : ""}`}
          style={{ width: "100%", backgroundColor: `${color}33`, border: `${color} 2px solid`}}
        >
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
}
