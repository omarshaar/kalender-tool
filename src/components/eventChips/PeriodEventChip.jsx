import React, { useContext } from 'react';
import { MainContext } from '../../context';

const PeriodEventChip = ({
    id,
    color,
    title,
    type,
    top,
    left,
    height,
    width,
    preventResizeEnd,
    breakHeight,
    breakStart,
    moveEventChipHandler,
    pEvent
  }) => {

  const { state, setState, dateChanger } = useContext(MainContext);
  const chipContainerId = (!type || type === "end-start") ? `p-l-${id}` : undefined;

  const containerClass = `p-layout-cell-chip-container ${type ? `mul-group-${id}` : ""}`;
  const containerStyle = {
    top: `${top}px`,
    left: `${left + 1.5 || 1.5}%`,
    height: `${height}px`,
    width: `${width - 2 || 97}%`,
    ...(type ? { minHeight: "0px" } : {})
  };

  const showTopHand = !type || (type && type.startsWith("start-"));

  let chipContent = null;
  if (!breakHeight || height < breakHeight) {
    chipContent = (
      <div
        className={`m-layout-cell-chip container-group-id-${id} ${type ? `${type}-chip-v` : ""}`}
        style={{ width: "100%", backgroundColor: `${color}3b`, border: `${color} 2px solid` }}
      >
        <span>{title}</span>
      </div>
    );
  } else if (breakHeight && height >= breakHeight) {
    const firstInnerClass = type ? (type.startsWith("start-") ? 'start-end-chip-v' : 'end-end-chip-v') : 'start-end-chip-v';
    const lastInnerClass = type ? (type.endsWith("-end") ? 'end-end-chip-v' : 'end-start-chip-v') : 'end-start-chip-v';

    chipContent = (
      <div style={{ height: "100%", width: "100%" }} className="d-flex jcb aic flex-col">
        <div
          style={{
            width: "100%",
            height: `${breakStart}px`,
            backgroundColor: `${color}3b`,
            border: `${color} 2px solid`,
            borderRadius: "calc(var(--radius-md) / 2)",
            padding: "1px 5px"
          }}
          className={firstInnerClass}
        >
          <span>{title}</span>
        </div>
        <div
          style={{
            width: "100%",
            height: `${breakHeight}px`,
            background: "#ffffff05"
          }}
          className="d-flex jcc aic"
        >
          <span> Pause </span>
        </div>
        <div
          style={{
            width: "100%",
            flex: 1,
            backgroundColor: `${color}3b`,
            border: `${color} 2px solid`,
            borderRadius: "calc(var(--radius-md) / 2)",
            padding: "1px 5px"
          }}
          className={lastInnerClass}
        >
        </div>
      </div>
    );
  }

  const showEventHand = !preventResizeEnd && (!type || (type && type.endsWith("-start")));

  function openEventDialog() {
    setState(prevState => ({
      ...prevState,
      toEditSelectedForm: pEvent,
      openDialogs: {
        ...prevState.openDialogs,
        addEventDialog: true
      }
    }));
  }

  return (
    <div onDoubleClick={openEventDialog}>
    <div
      id={chipContainerId}
      className={containerClass}
      onMouseDown={(e) => moveEventChipHandler(e, id)}
      // onDoubleClick={() => handleEditEvent(id)}
      // onClick={(e) => onMEventChipClick(e, id)}
      style={containerStyle}
    >
      {showTopHand && <div className="event-top-hand"></div>}
      {chipContent}
      {showEventHand && <div className="event-hand"></div>}
    </div>
    </div>
  );
};

export default PeriodEventChip;
