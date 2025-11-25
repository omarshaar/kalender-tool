import { Box } from "@mui/material";
import { AddEventDialog, CalenderHeader } from "../components";
import { MainContext } from "../context";
import { useContext, useEffect, useState, Suspense, lazy } from "react";

const CalenderMonthLayout = lazy(() => import("../calender-layouts/CalenderMonthLayout"));
const CalenderDayLayout = lazy(() => import("../calender-layouts/CalenderDayLayout"));
const CalenderPerodLayout = lazy(() => import("../calender-layouts/CalenderPerodLayout"));

export default function Calender(props) {
    const {state, setState} = useContext(MainContext);
    const  [layout, setLayout] = useState(<></>);
    useEffect(()=> selectLayout(), [state.selectedLayout]);

    function selectLayout() {
        switch (state.selectedLayout) {
            case 'month-layout':
                setLayout(<CalenderMonthLayout />)
                break;
            case 'day-layout':
                setLayout(<CalenderDayLayout />)
                break;
            case 'period-layout':
                setLayout(<CalenderPerodLayout />)
                break;
            default: setLayout(<CalenderMonthLayout />)
                break;
        }
    }

    return (
        <Box className="w-full h-full">
            <AddEventDialog isOpen={state.openDialogs.addEventDialog} isNewEvent={state.openDialogs.isNewEvent} />
            <CalenderHeader />
            <Suspense fallback={<div>Loading...</div>}>
                {layout}
            </Suspense>
        </Box>
    );
}