// import { createPeroidLayout } from "./createPeriodLayout.js";
// import * as DOM from "./DOM.js";

const gLocalStorageKey = "kalender_user_settings";

export function updateUserSetting(pKey, pValue) {
    const localSetting = getLocalSetting();
    localSetting[pKey] = pValue;
    localStorage.setItem(gLocalStorageKey, JSON.stringify(localSetting));
}

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

function displaySettings(pData) {
    // DOM.gEventTimeRangeCheckbox.checked = pData["isEventTimeRange"];
}

function createSettingObject() {
    return {
        "isEventTimeRange" : null,
        "isHideEmptyDays"  : null,
    }
}

function getLocalSetting() {
    return JSON.parse(localStorage.getItem(gLocalStorageKey));
}

export function adjustTimeRangeBasedOnEvent(pEvent) {
    const target = pEvent.target;
    const value  = target.checked;
    
    updateUserSetting("isEventTimeRange", value);
    // setTimeout(() => {createPeroidLayout()}, 0);
}

export function getSettingValue(pKey) {
    return (getLocalSetting())[pKey];
}

initSettings();