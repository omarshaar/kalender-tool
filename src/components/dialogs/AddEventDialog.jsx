import { Box } from "@mui/material";
import MyText from "../global/text/MyText";
import Icons from "../../assetes/Icons";
import { useContext, useEffect, useState } from "react";
import { MyButton } from "../global/button/MyButton";
import { MainContext } from "../../context";
import { generateRandomId } from "../../ultis/global";
import { getCurrentTime, getTodayDate } from "../../ultis/dates";
import { EventsContext } from "../../context/events";
import { findOverlappingEvent } from "../../ultis/events-helpers";

function createEmptyEvent(date = getTodayDate()) {
    return {
        id: generateRandomId(15),
        name: "",
        title: "",
        type: "event",
        targetEventId: "",
        period: {
            from: { date, time: getCurrentTime() },
            to: { date, time: null }
        },
        breaks: [],
        attributs: {
            isFullDay: false,
            overlapping: false,
            begleiter: false,
            teilnehmer: false
        }
    };
}

/**
 * Modal dialog to create, edit or delete a single calendar event.
 *
 * Business context: an event is either a `"event"` ("Veranstaltung" — a top-level
 * happening, e.g. a conference) or a `"programm"` ("Programmpunkt" — a sub-item that
 * belongs to a Veranstaltung via `targetEventId`, e.g. a session/workshop). See
 * `getValidationError` for the rules enforced before a save is allowed.
 *
 * Saving never writes to localStorage directly: new events are queued in
 * `eventsState.newEvents` and edits/deletes are merged into `eventsState.eventsList`
 * via `changeEventListHandler`. The actual persistence happens later, when the user
 * explicitly saves all pending changes (see `EventsProvider.saveToLocalHost`).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog should be rendered.
 */
export function AddEventDialog(props) {
    const {isOpen} = props;
    const {state, setState} = useContext(MainContext);
    const {eventsState, changeEventListHandler} = useContext(EventsContext);

    /** The event currently being edited in the form. Pre-filled from `state.toEditSelectedForm` when editing. */
    const [form, setForm] = useState(() => createEmptyEvent());

    // Whenever a different event is selected for editing (chip click, drag-created draft, ...),
    // load its data into the form.
    useEffect(() => {
        if (!isOpen) return;
        if (state.toEditSelectedForm) {
            setForm(state.toEditSelectedForm);
        } else {
            setForm(createEmptyEvent(state.newEventDate || getTodayDate()));
        }
    }, [isOpen, state.toEditSelectedForm, state.newEventDate]);

    /** Toggles the "Ganztätig" (whole day) flag, which hides the time inputs in the form. */
    function handleFullDay() {
        setForm(prevForm => ({ ...prevForm, attributs: { ...prevForm.attributs, isFullDay: !prevForm.attributs.isFullDay } }));
    }

    /**
     * Updates one date/time field of a break ("Pause") at `pIndex`, clamping it so the
     * break always stays inside the event's own period.
     *
     * @param {string} pValue - The new date ("YYYY-MM-DD") or time ("HH:MM") value.
     * @param {number|null} pIndex - Index of the break in `form.breaks`. `null` when
     *   called from `changeEventPeriod` to re-normalize all breaks (see `isNormalize`).
     * @param {"from"|"to"} pKey - Which end of the break is being changed.
     * @param {"date"|"time"} pTimeType - Whether `pValue` is a date or a time.
     * @param {boolean} [isNormalize] - When true, re-clamps the break's own field against
     *   `pValue` first (used when the event's period itself just changed).
     */
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

    /**
     * Returns the later of two "YYYY-MM-DD" date strings or "HH:MM" time strings
     * (lexicographic comparison, valid because both formats are fixed-width and
     * zero-padded). Either argument may be empty/null, in which case the other wins.
     */
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

    /** Same contract as {@link getBiggerDate}, but returns the earlier value instead. */
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

    /** Adds one empty break ("Pause") to the form. Only a single break is supported at a time. */
    function addBreak() {
        setForm(prevForm => {
            if (prevForm.breaks.length > 0) return prevForm;
            const newBreaks = [...prevForm.breaks, { from: { date: "", time: "" }, to: { date: "", time: "" } }];
            return { ...prevForm, breaks: newBreaks };
        });
    }

    /**
     * Updates one date/time field of the event's own period ("Von"/"Bis"), keeping
     * `from` <= `to` automatically, then re-clamps any existing break to still fit
     * inside the (possibly shrunk) period.
     *
     * @param {string} pValue - The new date or time value.
     * @param {"from"|"to"} pKey - Which end of the period is being changed.
     * @param {"date"|"time"} pTimeType - Whether `pValue` is a date or a time.
     */
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

    /** Removes the break ("Pause") at `pIndex` from the form. */
    function handleDeleteBreak(pIndex) {
        setForm(prevForm => {
            const newBreaks = prevForm.breaks.filter((_, index) => index !== pIndex);
            return { ...prevForm, breaks: newBreaks };
        });
    }

    /**
     * Validates the form before it may be saved. Checked in order:
     * 1. Required fields: name, start date, start time.
     * 2. If it's a "programm" (Programmpunkt), it must reference a valid, still-active
     *    "event" (Veranstaltung) via `targetEventId`.
     * 3. Every complete break ("Pause") must not end before it starts, and must stay
     *    fully inside the event's own period.
     *
     * @param {Object} pForm - The form to validate (same shape as `form`).
     * @returns {string|null} A user-facing (German) error message, or `null` if valid.
     */
    function getValidationError(pForm) {
        if (!pForm.name) {
            return "Bitte geben Sie eine Bezeichnung ein.";
        }
        if (!pForm.period.from.date) {
            return "Bitte geben Sie ein Startdatum ein.";
        }
        if (!pForm.period.from.time) {
            return "Bitte geben Sie eine Startzeit ein.";
        }
        if (pForm.type === "programm") {
            const activeEvents = getAllActiveEvents();
            const targetEvent = activeEvents.find(event => event.id === pForm.targetEventId && event.type === "event");
            if (!targetEvent) {
                return "Bitte wählen Sie eine gültige Veranstaltung für diesen Programmpunkt aus.";
            }
        }

        if (pForm.breaks && pForm.breaks.length) {
            const periodFrom = `${pForm.period.from.date}T${pForm.period.from.time}`;
            const periodTo = pForm.period.to?.date
                ? `${pForm.period.to.date}T${pForm.period.to.time || pForm.period.from.time}`
                : null;

            for (const breakItem of pForm.breaks) {
                if (!breakItem.from.date || !breakItem.from.time || !breakItem.to.date || !breakItem.to.time) {
                    continue; // incomplete break entry, nothing to validate yet
                }

                const breakFrom = `${breakItem.from.date}T${breakItem.from.time}`;
                const breakTo = `${breakItem.to.date}T${breakItem.to.time}`;

                if (breakFrom > breakTo) {
                    return "Das Ende einer Pause darf nicht vor ihrem Beginn liegen.";
                }
                if (breakFrom < periodFrom || (periodTo && breakTo > periodTo)) {
                    return "Eine Pause liegt außerhalb des Zeitraums des Termins.";
                }
            }
        }

        return null;
    }

    /** All events (saved + still-pending drafts) that are not soft-deleted. */
    function getAllActiveEvents() {
        return [...eventsState.eventsList, ...eventsState.newEvents].filter(event => !event.deleteMarked);
    }

    /** All active "programm" (Programmpunkt) events whose `targetEventId` points at `pEventId`. */
    function getLinkedProgrammItems(pEventId) {
        return getAllActiveEvents().filter(event => event.type === "programm" && event.targetEventId === pEventId);
    }

    /**
     * Validates and saves the form, either as:
     * - a brand new draft (pushed to `eventsState.newEvents`),
     * - the confirmation of an on-swipe-created draft (moved into `eventsState.eventsList`), or
     * - an update to an existing event (merged into `eventsState.eventsList`).
     *
     * Blocks the save (with a German alert) if required fields are missing, or if
     * "Darf nicht überschneiden" (overlapping) is enabled and the event's period
     * conflicts with another active event.
     */
    function onSaveUpdate() {
        const validationError = getValidationError(form);
        if (validationError) {
            window.alert(validationError);
            return;
        }

        if (form.attributs.overlapping) {
            const conflictingEvent = findOverlappingEvent(form, getAllActiveEvents());
            if (conflictingEvent) {
                window.alert(`Speichern nicht möglich: Der Termin überschneidet sich mit "${conflictingEvent.name}".`);
                return;
            }
        }

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
            eventsState.newEvents?.push(form);
            changeEventListHandler({ ...eventsState });
        }
    }

    /** Builds the `<option>` list for the "Veranstaltung" (parent event) select, from all `type === "event"` entries. */
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

    /** Closes the dialog without changing any event data. */
    function closeDialog() {
        setState(prevState => ({
            ...prevState,
            openDialogs: {
              ...prevState.openDialogs,
              addEventDialog: false
            }
          }));
    }

    /**
     * Soft-deletes the event currently being edited (marks it `deleteMarked: true`;
     * it is only removed for good on the next `saveToLocalHost`).
     *
     * If this is a "Veranstaltung" (event) with linked "Programmpunkte" (programm
     * events pointing at it via `targetEventId`), deletion is blocked by default:
     * the user must explicitly confirm a cascade delete of the event and all its
     * linked items together, otherwise nothing is deleted.
     */
    function handleDeleteEvent() {
        const confirm = window.confirm("bist du sicher?");
        if (!confirm) {
            closeDialog();
            return;
        }

        const targetId = state.toEditSelectedForm.id;
        const linkedProgrammItems = form.type === "event" ? getLinkedProgrammItems(targetId) : [];

        let deleteLinkedToo = false;
        if (linkedProgrammItems.length > 0) {
            deleteLinkedToo = window.confirm(
                `Diese Veranstaltung hat ${linkedProgrammItems.length} zugehörige(n) Programmpunkt(e). Möchten Sie die Veranstaltung und alle zugehörigen Programmpunkte löschen?`
            );
            if (!deleteLinkedToo) {
                // user declined the cascade delete -> abort the whole deletion, keep everything as is
                closeDialog();
                return;
            }
        }

        closeDialog();
        setForm(prevForm => ({ ...prevForm, deleteMarked: true }));

        const linkedIds = new Set(linkedProgrammItems.map(item => item.id));

        const updatedEventsList = eventsState.eventsList.map(eventItem => {
            if (eventItem.id === targetId) {
                form["deleteMarked"] = true
                return { ...eventItem, ...form };
            }
            if (deleteLinkedToo && linkedIds.has(eventItem.id)) {
                return { ...eventItem, deleteMarked: true };
            }
            return eventItem;
        });

        const updatedNewEvents = eventsState.newEvents.map(eventItem => {
            if (deleteLinkedToo && linkedIds.has(eventItem.id)) {
                return { ...eventItem, deleteMarked: true };
            }
            return eventItem;
        });

        changeEventListHandler({ ...eventsState, eventsList: updatedEventsList, newEvents: updatedNewEvents });
    }

    if (!isOpen) {
        return <></>;
    };

    return (
        <Box className="w-screen h-screen fixed top-0 left-0 z-[9999] flex justify-center items-center" >
            <Box className="bg-darkWhite bg-opacity-10 absolute top-0 left-0 w-full h-full -z-10 backdrop-blur-[2px]" onClick={closeDialog}></Box>

            <Box className="bg-black p-5 rounded-xl w-3/6">
                <Box className="w-full flex justify-end mb-3"> <Box className="icon-btn w-max" onClick={closeDialog}> <Icons.close className={"stroke-darkWhite"} /> </Box> </Box>

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
                            <MyButton className={"flex-1 !bg-red-600 !text-white"} onClick={closeDialog}> <Icons.close size={19} className={"stroke-white me-2"} />  <span>Schließen</span> </MyButton>
                        }
                    </Box>
                </Box>
            </Box>
        </Box>
    );
    
}
