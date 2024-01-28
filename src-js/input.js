
{
    const handle_mouse_event = state => e => {
        obem.mouse_pos[0] = e.clientX;
        obem.mouse_pos[1] = e.clientY;
        if(state !== undefined) { obem.mouse_buttons_pressed.set(e.button, state); }
    };

    window.addEventListener("mousedown", handle_mouse_event(true));
    window.addEventListener("mouseup", handle_mouse_event(false));
    window.addEventListener("mousemove", handle_mouse_event(undefined));
}

function obem_mouse_pos() {
    return obem.mouse_pos.slice(0, 2);
}

function obem_mouse_button(button) {
    const state = obem.mouse_buttons_pressed.get(Number(button));
    return state === undefined? false : state;
}


window.addEventListener("keydown", e => obem.keys_pressed.set(e.code, true));
window.addEventListener("keyup", e => obem.keys_pressed.set(e.code, false));

function obem_key(key) {
    const state = obem.keys_pressed.get(key);
    return state === undefined? false : state;
}


{
    const handle_touches = e => {
        obem.touch_pos = new Array(e.touches.length);
        for(let i = 0; i < e.touches.length; i += 1) {
            const touch = e.touches[i];
            obem.touch_pos[i] = [touch.pageX, touch.pageY];
        }
    };

    window.addEventListener("touchstart", handle_touches);
    window.addEventListener("touchmove", handle_touches);
    window.addEventListener("touchend", handle_touches);
}

function obem_touch_pos() {
    return obem.touch_pos.slice();
}