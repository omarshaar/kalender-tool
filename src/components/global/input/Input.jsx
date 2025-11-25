import React from "react";

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
