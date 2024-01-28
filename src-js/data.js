
function obem_data_store(value, key) {
    localStorage[key] = value;
}

function obem_data_has(key) {
    return localStorage[key] !== undefined;
}

function obem_data_get(key) {
    return localStorage[key];
}