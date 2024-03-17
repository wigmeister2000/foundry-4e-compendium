export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function union() {
    return [...new Set([...arguments].flat())];
}