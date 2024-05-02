
function obem_audio_from_buffer(encoded_buffer, callback) {
    obem.al
        .decodeAudioData(encoded_buffer)
        .then(buffer => callback({
            audio: 0n,
            buffer
        }));
}


function obem_listener_position(pos_x, pos_y, pos_z) {
    const listener = obem.al.listener;
    if("positionX" in listener
    && "positionY" in listener
    && "positionZ" in listener) {
        listener.positionX.value = pos_x;
        listener.positionY.value = pos_y;
        listener.positionZ.value = pos_z;
    } else {
        listener.setPosition(pos_x, pos_y, pos_z);
    }
}

function obem_listener_orientation(look_x, look_y, look_z, up_x, up_y, up_z) {
    const listener = obem.al.listener;
    if("forwardX" in listener
    && "forwardY" in listener
    && "forwardZ" in listener
    && "upX" in listener
    && "upY" in listener
    && "upZ" in listener) {
        listener.forwardX.value = look_x;
        listener.forwardY.value = look_y;
        listener.forwardZ.value = look_z;
        listener.upX.value = up_x;
        listener.upY.value = up_y;
        listener.upZ.value = up_z;
    } else {
        listener.setOrientation(look_x, look_y, look_z, up_x, up_y, up_z);
    }
}


class ObemAudioSource {
    constructor() {
        const al = obem.al;
        this.source_node = null;
        this.gain_node = al.createGain();
        this.panner_node = al.createPanner();
        this.panner_node.panningModel = "HRTF";
        this.panner_node.distanceModel = "exponential";
        this.gain_node.connect(this.panner_node);
        this.panner_node.connect(al.destination);
        this.pitch = 1.0;
        this.loop = false;
        this.playing = false;
        this.end_handlers = [];
    }
}

function obem_create_source() {
    return {
        source: 0n,
        src: new ObemAudioSource()
    };
}

function obem_source_position(source, pos_x, pos_y, pos_z) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    const src = source.src;
    src.panner_node.positionX.value = pos_x;
    src.panner_node.positionY.value = pos_y;
    src.panner_node.positionZ.value = pos_z;
}

function obem_source_gain(source, gain) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    source.src.gain_node.gain.value = gain;
}

function obem_source_pitch(source, pitch) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    const src = source.src;
    src.pitch = pitch;
    if(!src.playing) { return; }
    src.source_node.playbackRate.value = pitch;
}

function obem_source_play(source, audio) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    if(!(audio.buffer instanceof AudioBuffer)) {
        throw new Error("The given audio is invalid!");
    }
    const al = obem.al;
    const src = source.src;
    if(src.playing) { obem_source_stop(source); }
    const source_node = al.createBufferSource();
    source_node.buffer = audio.buffer;
    source_node.playbackRate.value = src.pitch;
    source_node.loop = src.loop;
    source_node.onended = () => {
        src.playing = src.loop;
        for(const handler of src.end_handlers) {
            handler();
        }
    };
    src.source_node = source_node;
    src.source_node.connect(src.gain_node);
    src.source_node.start();
    src.playing = true;
}

function obem_source_playing(source) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    return source.src.playing;
}

function obem_source_loop(source, loop) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    const src = source.src;
    src.loop = loop;
    if(!src.playing) { return; }
    src.source_node.loop = loop;
}

function obem_source_stop(source) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    const src = source.src;
    if(!src.playing) { return; }
    src.source_node.stop();
    src.source_node = null;
    src.playing = false;
}

function obem_source_on_end(source, handler) {
    if(!(source.src instanceof ObemAudioSource)) {
        throw new Error("The given source is invalid!");
    }
    src.end_handlers.push(handler);
}