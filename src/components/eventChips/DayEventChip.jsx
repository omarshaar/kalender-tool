import React, { useContext } from "react";
import Icons from "../../assetes/Icons";
import { MainContext } from "../../context";

const DayEventChip = ({
  id,
  start,
  end,
  title,
  height,
  top,
  color,
  type,
  breakStart,
  breakHeight,
  left,
  width,
  onMouseDown,
  pEvent
}) => {
  const { state, setState, dateChanger } = useContext(MainContext);

  const handleMouseDown = (e) => {
    if (typeof onMouseDown === "function") {
      onMouseDown(e, id);
    }
  };

  const handleDoubleClick = (e) => {
    if (typeof openEventModal === "function") {
      openEventModal(id, e);
    }
  };

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
      id={id}
      className="event-chip-container"
      style={{
        height: `${height}px`,
        top: `${top}px`,
        left: left + "%" || 0,
        width: `calc(${width || 100}% - 10px)`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {(!type || (type && type.startsWith("start-"))) && (
        <div className="event-top-hand"></div>
      )}

      {!breakHeight ? (
        <div
          className={`event-chip-body ${type ? `${type}-chip-v` : ""}`}
          style={
            color
              ? { backgroundColor: `${color}3b`, border: `${color} 2px solid` }
              : {}
          }
        >
          <div className="sawwaa d-flex jcb aic">
            <div className="event-chip-time flex items-center justify-center">
              <Icons.time size={20} strokeWidth={1.5} color={"#fff"} />
              <span
                style={{ marginInlineEnd: "5px", marginInlineStart: "5px" }}
              >
                Start:
              </span>
              <span id={`${id}-start`}>{start}</span>
            </div>

            <div>
              <span>-</span>
            </div>

            <div className="event-chip-time flex items-center justify-center">
              <Icons.time size={20} strokeWidth={1.5} color={"#fff"} />
              <span
                style={{ marginInlineEnd: "5px", marginInlineStart: "5px" }}
              >
                End:
              </span>
              <span id={`${id}-end`}>{end}</span>
            </div>
          </div>

          <div className="event-chip-title-wrapper flex justify-start items-center">
            <Icons.article size={20} strokeWidth={1.5} color={"#fff"} />
            <h5 className="event-chip-title">{title}</h5>
          </div>
        </div>
      ) : null}

      {breakHeight ? (
        <div
          className="d-flex jcb aic flex-col"
          style={{ height: "100%", width: "100%" }}
        >
          <div
            className={`event-chip-body ${
              type
                ? type.startsWith("start-")
                  ? "start-end-chip-v"
                  : "end-end-chip-v"
                : "start-end-chip-v"
            }`}
            style={{
              zIndex: 99,
              padding: "1px 5px",
              width: "100%",
              height: `${breakStart}px`,
              backgroundColor: `${color}3b`,
              border: `${color} 2px solid`,
              borderRadius: "calc(var(--radius-md) / 2)",
            }}
          >
            <div className="sawwaa d-flex jcb aic" style={{ marginTop: "4px" }}>
              <div className="event-chip-time flex items-center justify-center">
                <Icons.time size={20} strokeWidth={1.5} color={"#fff"} />
                <span
                  style={{ marginInlineEnd: "5px", marginInlineStart: "5px" }}
                >
                  Start:
                </span>
                <span id={`${id}-start`}>{start}</span>
              </div>

              <div>
                <span>-</span>
              </div>

              <div className="event-chip-time d-flex aic">
                <Icons.time size={20} strokeWidth={1.5} color={"#fff"} />
                <span
                  style={{ marginInlineEnd: "5px", marginInlineStart: "5px" }}
                >
                  End:
                </span>
                <span id={`${id}-end`}>{end}</span>
              </div>
            </div>
            <div className="event-chip-title-wrapper d-flex aic">
              <Icons.article size={20} strokeWidth={1.5} color={"#fff"} />
              <h5 className="event-chip-title">{title}</h5>
            </div>
          </div>
          <div
            className="d-flex jcc aic"
            style={{
              width: "100%",
              height: `${breakHeight}px`,
              background: "#ffffff05",
            }}
          >
            <span> Pause </span>
          </div>
          <div
            className={`event-chip-body ${
              type
                ? type.endsWith("-end")
                  ? "end-end-chip-v"
                  : "end-start-chip-v"
                : "end-start-chip-v"
            }`}
            style={{
              width: "100%",
              flex: 1,
              backgroundColor: `${color}3b`,
              border: `${color} 2px solid`,
              borderRadius: "calc(var(--radius-md) / 2)",
              padding: "1px 5px",
            }}
          ></div>
        </div>
      ) : null}

      {(!type || (type && type.endsWith("-start"))) && (
        <div 
          className="event-hand"
        ></div>
      )}
    </div>
    </div>
  );
};

export default DayEventChip;
