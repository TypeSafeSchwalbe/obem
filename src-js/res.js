
function obem_load_image(path, callback) {
    var img = new Image();
    img.onload = () => callback.call(
        obem_texture_from_image(img),
        BigInt(img.width), BigInt(img.height)
    );
    img.src = path;
}

function obem_load_text(path, callback) {
    fetch(path)
        .then(r => r.text())
        .then(t => callback.call(t))
}

function obem_load_obj_model(path, layout, callback) {
    fetch(path)
        .then(r => r.text())
        .then(obem_parse_obj_model(layout, callback))
}

const obem_parse_obj_model = (layout, callback) => src => {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const faces = [];
    for(const line of src.split("\n")) {
        const tokens = line.trim().split(" ").filter(t => t.length > 0);
        const values = tokens.slice(1);
        const expect_counts = (kind, ...counts) => {
            if(!counts.includes(values.length)) {
                let counts_str = counts.slice(0, -1).join(", ")
                    + (counts.length > 1? " or " : "")
                    + counts.at(-1);
                let values_str = "value" + (values.length === 1? "" : "s");
                throw `Expected ${counts_str} ${kind} ${values_str}, got ${values.length} instead!`;
            }
        };
        switch(tokens[0]) {
            case "v":
                expect_counts("vertex", 3, 6);
                vertices.push(values.map(Number));
                break;
            case "vn":
                expect_counts("normal", 3);
                normals.push(values.map(Number));
                break;
            case "vt":
                if(values.length < 2) {
                    throw `Expected at least 2 uv values, got ${values.length} instead!`;
                }
                uvs.push(values.slice(0, 2).map(Number));
                break;
            case "f":
                const specifiers = values.map(s => {
                    const components = s.split("/").map(c => c.length === 0? undefined : Number(c));
                    return components.concat(new Array(3 - components.length).fill(undefined))
                })
                if(specifiers.length < 3) {
                    throw `Expected at least 3 index specifiers, got ${specifiers.length} instead!`;
                }
                for(let i = 1; i < specifiers.length - 1; i += 1) {
                    faces.push([specifiers[0], specifiers[i], specifiers[i + 1]]);
                }
                break;
        }
    }
    const values = [];
    const indices = [];
    let next_idx = 0;
    for(const face of faces) {
        for(const vertex of face) {
            const vertex_values = [];
            for(const attribute_t of layout) {
                let i;
                switch(attribute_t) {
                    case "position":
                        if(vertex[0] === undefined) {
                            throw "Layout expects position, but face doesn't contain any!";
                        }
                        i = vertex[0];
                        if(i > vertices.length) { throw `${i} is not a valid vertex index!`; }
                        vertex_values.push(...vertices[i - 1].slice(0, 3));
                        break;
                    case "color":
                        if(vertex[0] === undefined) {
                            throw "Layout expects color, but face doesn't contain any!";
                        }
                        i = vertex[0];
                        if(i > vertices.length) { throw `${i} is not a valid vertex index!`; }
                        if(vertices[i - 1].length !== 6) {
                            throw `Vertex ${i} does not hold color information!`;
                        }
                        vertex_values.push(...vertices[i - 1].slice(3));
                        break;
                    case "uv":
                        if(vertex[1] === undefined) {
                            throw "Layout expects uv, but face doesn't contain any!";
                        }
                        i = vertex[1];
                        if(i > uvs.length) { throw `${i} is not a valid uv index!`; }
                        vertex_values.push(...uvs[i - 1]);
                        break;
                    case "normal":
                        if(vertex[2] === undefined) {
                            throw "Layout expects normal, but face doesn't contain any!";
                        }
                        i = vertex[2];
                        if(i > normals.length) { throw `${i} is not a valid normal index!`; }
                        vertex_values.push(...normals[i - 1]);
                        break;
                    default: throw `Invalid layout attribute value '${attribute_t}'`
                            + " (must be 'position', 'color', 'normal' or 'uv')!";
                }
            }
            let index = next_idx;
            for(let scanned_idx = 0; scanned_idx < next_idx; scanned_idx += 1) {
                let matches = true;
                for(let v = 0; v < vertex_values.length; v += 1) {
                    if(values[scanned_idx * vertex_values.length + v] === vertex_values[v]) { continue; }
                    matches = false;
                    break;
                }
                if(!matches) { continue; }
                index = scanned_idx;
                break;
            }
            if(index === next_idx) {
                values.push(...vertex_values);
                next_idx += 1;
            }
            indices.push(BigInt(index));
        }
    }
    return callback.call(values, indices);
};