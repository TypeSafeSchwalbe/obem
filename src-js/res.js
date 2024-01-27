
function obem_load_image(path, callback) {
    var img = new Image();
    img.onload = () => callback.call(
        obem_texture_from_image(img),
        BigInt(img.width), BigInt(img.height)
    );
    img.src = path;
}