
const obem = {
    canvas: null,
    gl: null,
    delta_time: 0.0,
    width: 0,
    height: 0,
    
    init_callbacks: [],
    frame_callbacks: []
};

window.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
    document.body.appendChild(canvas);
    obem.canvas = canvas;
    obem.gl = canvas.getContext("webgl");
    for(const c of obem.init_callbacks) { c(); }
    let last_timestamp = 0;
    const frame = (timestamp) => {
        if(last_timestamp != 0) {
            obem.delta_time = (timestamp - last_timestamp) / 1000.0;
        }
        last_timestamp = timestamp;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        for(const c of obem.frame_callbacks) { c(); }
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
};

function obem_on_init(init_callback) {
    if(obem.canvas !== null) {
        init_callback.call();
        return;
    }
    obem.init_callbacks.push(() => init_callback.call());
}

function obem_on_frame(frame_callback) {
    obem.frame_callbacks.push(() => frame_callback.call());
}

function obem_delta_time() {
    return obem.delta_time;
}