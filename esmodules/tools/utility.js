export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}