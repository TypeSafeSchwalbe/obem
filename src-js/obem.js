
const obem = {
    initialized: false,
    init_callbacks: [],
    frame_callbacks: [],

    init: function() {
        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        canvas.oncontextmenu = e => e.preventDefault();
        document.body.appendChild(canvas);
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl");
        this.initialized = true;
        for(const c of this.init_callbacks) { c(); }
    },

    enforce_init: function() {
        if(!this.initialized) {
            throw "Obem has not yet been initialized!"
                + " (Use 'obem::on_init' to have a function called when Obem is ready.)";
        }
    },

    canvas: null,
    gl: null,
    delta_time: 0.0,
    width: 0,
    height: 0,

    gameloop: function() {
        this.enforce_init();
        const canvas = obem.canvas;
        let last_timestamp = 0;
        const frame = (timestamp) => {
            if(last_timestamp != 0) {
                this.delta_time = (timestamp - last_timestamp) / 1000.0;
            }
            last_timestamp = timestamp;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            for(const c of this.frame_callbacks) { c(); }
            window.requestAnimationFrame(frame);
        };
        window.requestAnimationFrame(frame);
    },

    mouse_pos: [0.0, 0.0],
    mouse_buttons_pressed: new Map(),
    keys_pressed: new Map(),
    touch_pos: []
};

window.onload = () => {
    obem.init();
    obem.gameloop();
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