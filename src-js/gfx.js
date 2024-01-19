
function obem_create_mesh(vertices, indices) {
    obem.enforce_init();
    const gl = obem.gl;
    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices.map(n => Number(n))), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return {
        vertex_buffer,
        index_buffer,
        index_count: indices.length,
        mesh: 0n
    };
}


function obem_check_shader_comp(shader) {
    const gl = obem.gl;
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(!compiled) {
        throw gl.getShaderInfoLog(shader);
    }
}

function obem_check_shader_link(program) {
    const gl = obem.gl;
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        throw gl.getProgramInfoLog(program);
    }
}

function obem_create_shader(vertex_src, fragment_src) {
    obem.enforce_init();
    const gl = obem.gl;
    const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex_shader, vertex_src);
    gl.compileShader(vertex_shader);
    obem_check_shader_comp(vertex_shader);
    const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment_shader, fragment_src);
    gl.compileShader(fragment_shader);
    obem_check_shader_comp(fragment_shader);
    const shader_program = gl.createProgram();
    gl.attachShader(shader_program, vertex_shader);
    gl.attachShader(shader_program, fragment_shader);
    gl.linkProgram(shader_program);
    obem_check_shader_link(shader_program);
    return {
        vertex_shader,
        fragment_shader,
        shader_program,
        shader: 0n
    };
}


function obem_create_texture(width, height) {
    obem.enforce_init();
    const data = new Uint8Array(Number(width) * Number(height) * 4);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Number(width), Number(height), 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return {
        texture,
        width: () => Number(width),
        height: () => Number(height),
        texture: 0n
    };
}


function obem_main_surface() {
    obem.enforce_init();
    return {
        frame_buffer: null,
        width: () => obem.canvas.width,
        height: () => obem.canvas.height,
        surface: 0n
    };
}

function obem_create_surface(texture) {
    obem.enforce_init();
    const gl = obem.gl;
    if(!(texture.texture instanceof WebGLTexture)) {
        throw new Error("The given texture is invalid!");
    }
    const frame_buffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        texture.texture, 0
    ); 
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error(
            "Framebuffer attachments are not supported by this browser!"
        );
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
        frame_buffer,
        width: texture.width,
        height: texture.height,
        surface: 0n
    };
}

function obem_surface_width(surface) {
    if(surface.frame_buffer !== null
        && !(surface.frame_buffer instanceof WebGLFramebuffer)) {
        throw new Error("The given surface is invalid!");
    }
    return BigInt(surface.width());
}

function obem_surface_height(surface) {
    if(surface.frame_buffer !== null
        && !(surface.frame_buffer instanceof WebGLFramebuffer)) {
        throw new Error("The given surface is invalid!");
    }
    return BigInt(surface.height());
}

function obem_clear_color(surface, r, g, b, a) {
    obem.enforce_init();
    const gl = obem.gl;
    if(surface.frame_buffer !== null
        && !(surface.frame_buffer instanceof WebGLFramebuffer)) {
        throw new Error("The given surface is invalid!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.frame_buffer);
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function obem_clear_depth(surface, d) {
    obem.enforce_init();
    const gl = obem.gl;
    if(surface.frame_buffer !== null
        && !(surface.frame_buffer instanceof WebGLFramebuffer)) {
        throw new Error("The given surface is invalid!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.frame_buffer);
    gl.clearDepth(d);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


function obem_render(mesh, attrib_sizes, shader, depth_test, surface) {
    obem.enforce_init();
    const gl = obem.gl;
    if(depth_test === true) { gl.enable(gl.DEPTH_TEST); }
    else { gl.disable(gl.DEPTH_TEST); }
    if(!(mesh.vertex_buffer instanceof WebGLBuffer)
        || !(mesh.index_buffer instanceof WebGLBuffer)) {
        throw new Error("The given mesh is invalid!");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertex_buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index_buffer);
    if(!(shader.shader_program instanceof WebGLProgram)) {
        throw new Error("The given shader is invalid!");
    }
    gl.useProgram(shader.shader_program);
    const attrib_count = gl.getProgramParameter(
        shader.shader_program, gl.ACTIVE_ATTRIBUTES
    );
    if(attrib_sizes.length !== attrib_count) {
        throw new Error(
            "Attrib size array and shader program attrib count do not match!"
        );
    }
    const attrib_stride = attrib_sizes
        .reduce((a, n) => a + Number(n), 0) * 4;
    let attrib_offset = 0;
    for(let i = 0; i < attrib_count; i += 1) {
        const attrib_name = gl.getActiveAttrib(shader.shader_program, i)
            .name;
        const attrib_idx = gl.getAttribLocation(
            shader.shader_program, attrib_name
        );
        const attrib_size = Number(attrib_sizes[i]);
        gl.vertexAttribPointer(
            attrib_idx, attrib_size, gl.FLOAT, false,
            attrib_stride, attrib_offset
        );
        gl.enableVertexAttribArray(attrib_idx);
        attrib_offset += attrib_size * 4;
    }
    if(surface.frame_buffer !== null
        && !(surface.frame_buffer instanceof WebGLFramebuffer)) {
        throw new Error("The given surface is invalid!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.frame_buffer);
    gl.viewport(0, 0, surface.width(), surface.height());
    gl.drawElements(gl.TRIANGLES, mesh.index_count, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    for(let i = 0; i < attrib_count; i += 1) {
        const attrib_name = gl.getActiveAttrib(shader.shader_program, i)
            .name;
        const attrib_idx = gl.getAttribLocation(
            shader.shader_program, attrib_name
        );
        gl.disableVertexAttribArray(attrib_idx);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}







