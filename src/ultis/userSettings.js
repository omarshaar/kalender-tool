/**
 * @file Legacy user-settings store, apparently left over from a pre-React version of
 * this app (see the commented-out `DOM.js`/`createPeriodLayout.js` imports below,
 * which don't exist in this codebase).
 *
 * NOT CURRENTLY USED: nothing in `src/` imports this module. The settings it manages
 * ("isEventTimeRange", "isHideEmptyDays") are, in the current React app, instead
 * handled by `CalenderHeader.jsx` reading/writing its own `"kalender_user_setting"`
 * `localStorage` key (singular, no trailing "s" — a different key than the
 * `gLocalStorageKey` below) directly through `MainContext` state.
 *
 * Because it is unreferenced, `initSettings()` at the bottom never actually runs in
 * the app. Kept as-is (undeleted) pending a decision on whether to remove it.
 */

// import { createPeroidLayout } from "./createPeriodLayout.js";
// import * as DOM from "./DOM.js";

const gLocalStorageKey = "kalender_user_settings";

/** Reads-modifies-writes one key in the `kalender_user_settings` localStorage object. */
export function updateUserSetting(pKey, pValue) {
    const localSetting = getLocalSetting();
    localSetting[pKey] = pValue;
    localStorage.setItem(gLocalStorageKey, JSON.stringify(localSetting));
}

/** Ensures `kalender_user_settings` exists in localStorage (seeding defaults on first run) and returns it. */
function initSettings() {
    const settings  = createSettingObject();
    let localData = localStorage.getItem(gLocalStorageKey);
    
    if (!localData) {
        localStorage.setItem(gLocalStorageKey, JSON.stringify(settings));
        localData = localStorage.getItem(gLocalStorageKey);
    }

    const data = JSON.parse(localData);
    displaySettings(data);

    return data;
}

/** Legacy DOM sync hook; a no-op now since the referenced `DOM` module doesn't exist in this codebase. */
function displaySettings(pData) {
    // DOM.gEventTimeRangeCheckbox.checked = pData["isEventTimeRange"];
}

/** Default shape for `kalender_user_settings`. */
function createSettingObject() {
    return {
        "isEventTimeRange" : null,
        "isHideEmptyDays"  : null,
    }
}

/** Reads the `kalender_user_settings` object from localStorage. */
function getLocalSetting() {
    return JSON.parse(localStorage.getItem(gLocalStorageKey));
}

/** Change handler for a checkbox toggling "isEventTimeRange". */
export function adjustTimeRangeBasedOnEvent(pEvent) {
    const target = pEvent.target;
    const value  = target.checked;

    updateUserSetting("isEventTimeRange", value);
    // setTimeout(() => {createPeroidLayout()}, 0);
}

/** Reads one key from `kalender_user_settings`. */
export function getSettingValue(pKey) {
    return (getLocalSetting())[pKey];
}

initSettings();