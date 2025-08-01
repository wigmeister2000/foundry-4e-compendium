export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function union() {
    return [...new Set([...arguments].flat())];
}

export function randomChoice(array) {
    const i = Math.floor(Math.random() * array.length);
    return array[i];
}

export function dropFirst(arr, value) {
    let index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

export function dropAll(arr, value) {
    let i = 0;
    while (i < arr.length) {
        if (arr[i] === value) {
            arr.splice(i, 1);
        } else {
            ++i;
        }
    }
    return arr;
}

export function countOccurences(arr) {
    const tally = {};
    arr.forEach(x => tally[x] = (tally[x] || 0) + 1);
    return tally;
}