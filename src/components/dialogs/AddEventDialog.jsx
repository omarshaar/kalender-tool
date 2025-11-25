import { Box, setRef } from "@mui/material";
import MyText from "../global/text/MyText";
import Icons from "../../assetes/Icons";
import MyTitle from "../global/title/MyTitle";
import { useContext, useEffect, useState } from "react";
import { MyButton } from "../global/button/MyButton";
import { MainContext } from "../../context";
import { generateRandomId } from "../../ultis/global";
import { getCurrentTime, getTodayDate } from "../../ultis/dates";
import { EventsContext } from "../../context/events";

export function AddEventDialog(props) {
    const {isOpen, isNewEvent} = props;
    const {state, setState} = useContext(MainContext);
    const {eventsState, setEventsState, changeEventListHandler} = useContext(EventsContext);
    const [form, setForm] = useState({
        id: generateRandomId(15),
        name: "",
        title: "",
        type: "event",
        targetEventId: "",
        period: {
            from: {
                date: getTodayDate(),
                time: getCurrentTime(),
            },
            to: {
                date: null,
                time: null,
            }
        },
        breaks: [],
        attributs: {
            isFullDay: false,
            overlapping: false,
            begleiter: false,
            teilnehmer: false
        }
    });

    useEffect(()=> {
        if (state.toEditSelectedForm) {
            setForm(state.toEditSelectedForm);
        }
    },[state.toEditSelectedForm])

    function handleFullDay() {
        setForm(prevForm => ({ ...prevForm, attributs: { ...prevForm.attributs, isFullDay: !prevForm.attributs.isFullDay } }));
    }

    function handleChangeBreak_(pValue, pIndex, pKey, pTimeType) {
        setForm(prevForm => {
            const newBreaks = [...prevForm.breaks];
            const breakItem = newBreaks[pIndex];
            // event data
            const eventFromDate = prevForm.period.from.date;
            const eventFromTime = prevForm.period.from.time;
            const eventToDate   = prevForm.period.to.date;
            const eventToTime   = prevForm.period.to.time;
            

            if (pKey == "from") {
                if (pTimeType == "date") { 
                    if (eventFromDate <= pValue && eventToDate >= pValue) {
                        breakItem.from.date = pValue;
                    } else if (eventFromDate <= pValue && !eventToDate) {
                        breakItem.from.date = pValue;
                    }
                } else {
                    if (eventFromTime <= pValue && eventToTime >= pValue) {
                        breakItem.from.time = pValue;
                    } else if (eventFromTime <= pValue && !eventToTime) {
                        breakItem.from.time = pValue;
                    }
                }
            } else {
                if (pTimeType == "date" && !eventToDate) {
                    breakItem.to.date = pValue;
                } else {

                }

                if (pTimeType == "time" && !eventToTime) {
                    breakItem.to.date = pValue;
                } else {
                    
                }
            }
    
            return { ...prevForm, breaks: newBreaks };
        });
    }

    function handleChangeBreak(pValue, pIndex, pKey, pTimeType, isNormalize) {
        setForm(prevForm => {
            const newBreaks = prevForm.breaks.map((breakItem, index) => {
                if (index === pIndex) {
                    const updatedBreak = { ...breakItem };
                    if (pKey === "from") {
                        if (pTimeType === "date") {
                            if (isNormalize) pValue = getBiggerDate(pValue, breakItem.from.date);
                            updatedBreak.from.date = getSmallerDate(getBiggerDate(prevForm.period.from.date, pValue), prevForm.period.to.date);
                        } else if (pTimeType === "time") {
                            if (isNormalize) pValue = getBiggerDate(pValue, breakItem.from.time);
                            updatedBreak.from.time = getSmallerDate(getBiggerDate(prevForm.period.from.time, pValue), prevForm.period.to.time);
                        }
                    } else {
                        if (pTimeType === "date") {
                            if (isNormalize) pValue = getSmallerDate(pValue, breakItem.to.date);
                            updatedBreak.to.date = getBiggerDate(getSmallerDate(pValue, prevForm.period.to.date), breakItem.from.date);
                        } else if (pTimeType === "time") {
                            if (isNormalize) pValue = getSmallerDate(pValue, breakItem.to.time);
                            updatedBreak.to.time = getBiggerDate(getSmallerDate(pValue, prevForm.period.to.time), breakItem.from.time);
                        }
                    }
                    return updatedBreak;
                }
                return breakItem;
            });
    
            return { ...prevForm, breaks: newBreaks };
        });
    }

    function getBiggerDate(pDate1, pDate2) {
        if (!pDate1) {
            return pDate2
        }else if (!pDate2) {
            return pDate1
        }

        if (pDate1 > pDate2) {
            return pDate1
        } 
        return pDate2;
    }

    function getSmallerDate(pDate1, pDate2) {
        if (!pDate1) {
            return pDate2
        }else if (!pDate2) {
            return pDate1
        }
        
        if (pDate1 < pDate2) {
            return pDate1
        } 
        return pDate2;
    }

    function addBreak() {
        setForm(prevForm => {
            if (prevForm.breaks.length > 0) return prevForm;
            const newBreaks = [...prevForm.breaks, { from: { date: "", time: "" }, to: { date: "", time: "" } }];
            return { ...prevForm, breaks: newBreaks };
        });
    }
    
    function changeEventPeriod(pValue, pKey, pTimeType) {
        setForm(prevForm => {
            const updatedPeriod = { ...prevForm.period };
            if (pKey === "to") {
                updatedPeriod[pKey][pTimeType] = getBiggerDate(pValue, prevForm.period["from"][pTimeType] || "");
            } else {
                updatedPeriod[pKey][pTimeType] = getSmallerDate(pValue, prevForm.period["to"][pTimeType] || "");
            }
            return { ...prevForm, period: updatedPeriod };
        });
        handleChangeBreak(pValue, null, pKey, pTimeType, true);
    }

    function handleDeleteBreak(pIndex) {
        setForm(prevForm => {
            const newBreaks = prevForm.breaks.filter((_, index) => index !== pIndex);
            return { ...prevForm, breaks: newBreaks };
        });
    }

    function onSaveUpdate() {
        if (state.toEditSelectedForm) {
            let updatedEventsList = [];
            if (state.toEditSelectedForm.attributs.isNewEvent) { // if edit on-swipe event
                delete form.attributs.isNewEvent;
                updatedEventsList = [...eventsState.eventsList, form];
                setTimeout(() => {
                    setState(prevState => ({
                        ...prevState,
                        onSwipeEventID: null
                    }))
                }, 50);
            }else { // if edit exsist event
                updatedEventsList = eventsState.eventsList.map(eventItem => {
                    if (eventItem.id === state.toEditSelectedForm.id) {
                        return { ...eventItem, ...form};
                    }
                    return eventItem;
                });
            }
            
            changeEventListHandler({ ...eventsState, eventsList: updatedEventsList });
        } else {
            if (!(form.name) || !(form.period.from.date) || !(form.period.from.time)) {
                window.alert("Speichen nicht möglisch");
            } else {
                eventsState.newEvents?.push(form);
                changeEventListHandler({ ...eventsState });
            }
        }
    }

    function createSelectEventOptions() {
        const events  = eventsState.eventsList.filter(event => event.type == "event");
        const options = [];

        events.forEach(eventItem => {
            options.push(<option key={eventItem.id+"_option_"} value={eventItem.id}>{eventItem.name}</option>)
        });

        return (
            options
        )
    }

    function handleDeleteEvent() {
        const confirm = window.confirm("bist du sicher?");
        if (!confirm) {
            setState(prevState => ({
                ...prevState,
                openDialogs: {
                  ...prevState.openDialogs,
                  addEventDialog: false
                }
              }));
            return
        }
        setState(prevState => ({
            ...prevState,
            openDialogs: {
              ...prevState.openDialogs,
              addEventDialog: false
            }
          }));
        setForm(prevForm => ({ ...prevForm, deleteMarked: true }));

        const updatedEventsList = eventsState.eventsList.map(eventItem => {
            if (eventItem.id === state.toEditSelectedForm.id) {
                form["deleteMarked"] = true
                return { ...eventItem, ...form };
            }
            return eventItem;
        });
        changeEventListHandler({ ...eventsState, eventsList: updatedEventsList });
    }

    if (!isOpen) {
        return <></>;
    };

    return (
        <Box className="w-screen h-screen fixed top-0 left-0 z-[9999] flex justify-center items-center" >
            <Box className="bg-darkWhite bg-opacity-10 absolute top-0 left-0 w-full h-full -z-10 backdrop-blur-[2px]" onClick={() => setState(prevState => ({ ...prevState, openDialogs: { ...prevState.openDialogs, addEventDialog: false } }))}></Box>

            <Box className="bg-black p-5 rounded-xl w-3/6">
                <Box className="w-full flex justify-end mb-3"> <Box className="icon-btn w-max" onClick={() => setState(prevState => ({ ...prevState, openDialogs: { ...prevState.openDialogs, addEventDialog: false } }))}> <Icons.close className={"stroke-darkWhite"} /> </Box> </Box>

                <Box className="w-full ">
                    <Box className="w-full flex items-center mb-4">
                        <Icons.article className={"stroke-darkWhite me-2 modal-icons"} size={26} />
                        <input placeholder="Bezeichnung" type="text" className="w-full border-b border-darkWhite outline-none p-1 px-3" value={form.name || ""} onChange={(event) => setForm({...form, name: event.target.value})} />
                    </Box>

                    <Box className="w-full flex items-center mb-4">
                        <Icons.article className={"stroke-darkWhite me-2 modal-icons"} size={26} />
                        <input placeholder="Title" type="text" className="w-full border-b border-darkWhite outline-none p-1 px-3" value={form.title || ""} onChange={(event) => setForm({...form, title: event.target.value})} />
                    </Box>

                    <Box className="w-full flex items-start mb-4 flex-col">
                        <MyText className="mb-1 font-semibold">Von:</MyText>
                        <Box className="w-full flex items-center">
                            <Box className="flex-1 flex items-center me-3">
                                <Box className="w-max"><Icons.date className={"stroke-darkWhite me-2 modal-icons"} size={24} /></Box>
                                <input value={form.period.from.date || ""} placeholder="date" type="date" className="w-full border-b border-darkWhite outline-none p-1 px-3" onChange={(event) => changeEventPeriod(event.target.value, "from", "date")} />
                            </Box>
                            { !form.attributs.isFullDay ?
                                <Box className="flex-1 flex items-center">
                                    <Box className="w-max"><Icons.time className={"stroke-darkWhite me-2 modal-icons"} size={24} /></Box>
                                    <input value={form.period.from.time || ""} placeholder="time" type="time" className="w-full border-b border-darkWhite outline-none p-1 px-3" onChange={(event) => changeEventPeriod(event.target.value, "from", "time")} />
                                </Box>
                                : <></>
                            }
                        </Box>
                    </Box>

                    <Box className="w-full flex items-start mb-5 flex-col">
                        <MyText className="mb-1 font-semibold">Bis:</MyText>
                        <Box className="w-full flex items-center">
                            <Box className="flex-1 flex items-center me-3">
                                <Box className="w-max"><Icons.date className={"stroke-darkWhite me-2 modal-icons"} size={24} /></Box>
                                <input value={form.period.to.date || ""} placeholder="date" type="date" className="w-full border-b border-darkWhite outline-none p-1 px-3" onChange={(event) => changeEventPeriod(event.target.value, "to", "date")} />
                            </Box>

                            { !form.attributs.isFullDay ? 
                                <Box className="flex-1 flex items-center">
                                    <Box className="w-max"><Icons.time className={"stroke-darkWhite me-2 modal-icons"} size={24} /></Box>
                                    <input value={form.period.to.time || ""} placeholder="time" type="time" className="w-full border-b border-darkWhite outline-none p-1 px-3" onChange={(event) => changeEventPeriod(event.target.value, "to", "time")} />
                                </Box>
                                : <></>
                            }
                        </Box>
                    </Box>

                    <Box className="w-full flex items-start flex-col mb-4">
                        <Box className="w-full flex items-center justify-between mb-3">
                            <MyText className="font-semibold">Pausen: </MyText>
                            <Box className="icon-btn bg-darkWhite rounded-md" onClick={addBreak} ><Icons.plus className={"stroke-black"} /></Box>
                        </Box>

                        {
                            form.breaks.map((brakItem, index) => 
                            <Box key={"break_item_"+index} className="w-full flex items-start flex-col rounded-lg bg-[#121212] p-2">
                                <Box className="w-full flex items-center mb-3">
                                    <MyText className={"me-3 mt-1"}>Von: </MyText>
                                    <input value={brakItem.from.date || ""} onChange={(event) => handleChangeBreak(event.target.value, index, "from", "date")} placeholder="date" type="date" className="w-full border-b border-darkWhite outline-none p-1 px-3 me-3" />
                                    <input value={brakItem.from.time || ""} onChange={(event) => handleChangeBreak(event.target.value, index, "from", "time")} placeholder="time" type="time" className="w-full border-b border-darkWhite outline-none p-1 px-3" />
                                    <Box className="w-max bg-red-600 p-1 rounded-md ml-3 mt-2 icon-btn" onClick={() => handleDeleteBreak(index)} >
                                        <Icons.trash className={"stroke-darkWhite"} size={20} strokeWidth={1.5} />
                                    </Box>
                                </Box>

                                <Box className="w-full flex items-center mb-3 pr-10">
                                    <MyText className={"me-3 mt-1"}>Bis: </MyText>
                                    <input placeholder="date" value={brakItem.to.date || ""} onChange={(event) => handleChangeBreak(event.target.value, index, "to", "date")} type="date" className="w-full border-b border-darkWhite outline-none p-1 px-3 me-3" />
                                    <input placeholder="time" value={brakItem.to.time || ""} onChange={(event) => handleChangeBreak(event.target.value, index, "to", "time")} type="time" className="w-full border-b border-darkWhite outline-none p-1 px-3" />
                                </Box>
                            </Box>)
                        }

                        
                    </Box>

                    <Box className="w-full flex items-start flex-col mb-4">
                        <MyText className="font-semibold mb-2">Type:</MyText>
                        <div className="d-flex aic w-full">
                            <div className="calender-layout-type-btns d-flex aic w-full !rounded-md">
                                <div onClick={()=> setForm({...form, type: "event"})} className={`!rounded-md calender-layout-type-btn-item d-flex jcc aic ${ form.type == "event" ? "calender-layout-type-btn-item-active" : "" } `} id="month-layout-btn"><span className="text-black dark:text-darkWhite">Veranstaltung</span></div>
                                <div onClick={()=> setForm({...form, type: "programm"})} className={`!rounded-md calender-layout-type-btn-item d-flex jcc aic ${ form.type == "programm" ? "calender-layout-type-btn-item-active" : "" } `} id="day-layout-btn"><span className="text-black dark:text-darkWhite">Programmpunkt</span></div>
                            </div>
                        </div>
                    </Box>

                    {  form.type == "programm" 
                        ? <Box className="w-full flex items-start flex-col mb-4">
                            <MyText className="font-semibold mb-2">Veranstaltung:</MyText>
                            <select name="" id="" className="w-full p-2 border-b outline-none border-darkWhite" value={form.targetEventId} onChange={(event) => { setForm(prevForm => ({ ...prevForm, targetEventId: event.target.value })) }}>
                                <option value="0">auswählen</option>
                                {createSelectEventOptions()}
                            </select>
                        </Box>
                        : <></>
                    }

                    <Box className="w-full flex items-start flex-col mb-4">
                        <Box className="w-full flex items-center justify-start mb-2">
                            <input type="checkbox" id="c-d-fullday" className="modal-icons me-2" checked={form.attributs.isFullDay} onChange={handleFullDay} />
                            <label htmlFor="c-d-fullday"> <MyText>Ganztätig</MyText> </label>
                        </Box>

                        <Box className="w-full flex items-center justify-start mb-2">
                            <input type="checkbox" id="c-d-overlap" className="modal-icons me-2" checked={form.attributs.overlapping} onChange={(e)=> setForm(prevForm => ({ ...prevForm, attributs: { ...prevForm.attributs, overlapping: e.target.checked } })) } />
                            <label htmlFor="c-d-overlap"> <MyText>Darf nicht überschneiden</MyText> </label>
                        </Box>

                        { form.type == "programm" ? <><Box className="w-full flex items-center justify-start mb-2">
                            <input type="checkbox" id="c-d-begleiter" className="modal-icons me-2" checked={form.attributs.begleiter} onChange={(e)=> setForm(prevForm => ({ ...prevForm, attributs: { ...prevForm.attributs, begleiter: e.target.checked } })) } />
                            <label htmlFor="c-d-begleiter"> <MyText>Für Begleiter</MyText> </label>
                        </Box>

                        <Box className="w-full flex items-center justify-start ">
                            <input type="checkbox" id="c-d-teilnehmer" className="modal-icons me-2" checked={form.attributs.teilnehmer} onChange={(e)=> setForm(prevForm => ({ ...prevForm, attributs: { ...prevForm.attributs, teilnehmer: e.target.checked } })) } />
                            <label htmlFor="c-d-teilnehmer"> <MyText>Für Teilnehmer</MyText> </label>
                        </Box></> : <></>}
                    </Box>

                    <Box className="flex items-center justify-between">
                        <MyButton className={"flex-1 me-3"} onClick={onSaveUpdate} > <Icons.check size={19} className={"stroke-black me-2"} /> Speichern </MyButton>
                        { state.toEditSelectedForm ?
                            <MyButton className={"flex-[0.3] !bg-red-600 !text-white"} onClick={() => handleDeleteEvent()}> <Icons.close size={19} className={"stroke-white me-2"} />  <span>Löschen</span> </MyButton>
                            :
                            <MyButton className={"flex-1 !bg-red-600 !text-white"} onClick={() => setState(prevState => ({ ...prevState, openDialogs: { ...prevState.openDialogs, addEventDialog: false } }))}> <Icons.close size={19} className={"stroke-white me-2"} />  <span>Schließen</span> </MyButton>
                        }
                    </Box>
                </Box>
            </Box>
        </Box>
    );
    
}