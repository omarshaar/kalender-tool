/**
 * Globale Functions
 *  
 * 2.0.0        2024-08-25  Omar Shaar
 *              - Secound implementation
 */


/**
 * Generates a random string of the specified length.
 *
 * @param {number} length - The length of the random string to generate.
 * @returns {string} A random string consisting of uppercase and lowercase letters and digits.
 */
export function generateRandomId(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * Retrieves the value of a specified CSS variable from the root element.
 *
 * @param {string} variableName - The name of the CSS variable to retrieve (e.g., '--my-variable').
 * @returns {number} The value of the specified CSS variable, parsed as an integer.
 */
export function getCSSVariableValue(variableName) {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return parseInt(computedStyle.getPropertyValue(variableName));
}

export function removeChipIdPrefix(id) {
    const prefix  = "m-l-";
    const prefix2 = "p-l-";
    if (id.startsWith(prefix)) {
        return id.substring(prefix.length);
    }

    if (id.startsWith(prefix2)) {
        return id.substring(prefix2.length);
    }
    return id;
}