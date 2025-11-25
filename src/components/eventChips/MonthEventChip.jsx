import { useContext } from "react";
import { AddEventDialog } from "../dialogs/AddEventDialog";
import { MainContext } from "../../context";

export default function MonthEventChip({ id, width, color, title, type, onMouseDown, onMouseUp, pEvent, isVeranstaltung, onDoubleClick }) {
  const chipContainerId = `chip-container-${id}`;
  const { state, setState, dateChanger } = useContext(MainContext);

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
