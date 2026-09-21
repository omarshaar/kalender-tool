/**
 * @file Themed text/date/time input, forwarding its ref so callers (e.g. the calendar
 * header's date pickers) can imperatively call `.showPicker()` on it.
 */

import React from "react";

/** A styled `<input>` (defaults to `type="text"`) that forwards its ref to the underlying DOM element. */
const MyInput = React.forwardRef(({ children, onChange, type, id, className }, ref) => {
  return (
    <input
      onChange={onChange}
      type={type || "text"}
      id={id || ""}
      className={`select-date-picker ${className || ""}`}
      ref={ref}
    />
  );
});

export default MyInput;
