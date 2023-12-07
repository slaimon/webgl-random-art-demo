export {submitJob, toggleOldRenderer, copyGlslSource, saveGlslSource, savePicture}

import {new_picture, compute_pixel} from "./old/gen.js"
import {webglRenderFrag} from "./webgl.js"
import * as compute from "./port/compute.js"
import * as glsl from "./port/glsl/glsl.js"

function getJobParameters() {
    const seed = document.getElementById("seed").value;
    var size = parseInt(document.getElementById("dnaSize").value);
    if(!size) size = compute.get_default_size(seed);

    return [size, seed];
}

const oldCanvasPerformance = document.getElementById("oldCanvasPerformance");
const webglCanvasPerformance = document.getElementById("webglCanvasPerformance");

const canvas = document.getElementById("oldCanvas");
const resolution = parseInt(canvas.getAttribute("width"));
const ctx = canvas.getContext("2d");

var useOldRenderer = true;
var lastSubmittedJob = undefined;
function toggleOldRenderer() {
    var toggle =  document.getElementById("oldRendererToggle");
    useOldRenderer = !useOldRenderer;

    if(!useOldRenderer) {
        oldCanvasPerformance.innerHTML = " ";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    if(useOldRenderer && lastSubmittedJob !== undefined) {
        const [size, seed] = lastSubmittedJob;
        paintOldPicture(size, seed);
    }
}

var oldStart = undefined;
var oldEnd = undefined;
function paintOldPictureLine(rna, j) {
    return function() {
        if(!useOldRenderer) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        var pixels = new Uint8ClampedArray(resolution * 4.0);

        for (var i = 0; i < resolution; i++) {
            var x = 2.0 * (i + 0.5) / resolution - 1.0;
            var y = 2.0 * (j + 0.5) / resolution - 1.0;
            var color = compute_pixel(rna,x,y).split(',');
            var red = parseInt(color[0]);
            var green = parseInt(color[1]);
            var blue = parseInt(color[2]);
            var position = i * 4.0;
            pixels[position] = red;
            pixels[position+1] = green;
            pixels[position+2] = blue;
            pixels[position+3] = 255;
        }

        var imageData = new ImageData(pixels, resolution, 1);
        ctx.putImageData(imageData, 0, j);
        if(j==resolution-1) {
            oldEnd = performance.now();
            oldCanvasPerformance.innerHTML = `${((oldEnd-oldStart)/1000.0).toFixed(2)} s`;
        }
    }
}

async function paintOldPicture(size, seed) {
    if (!useOldRenderer) {
        return;
    }
    oldCanvasPerformance.innerHTML = '...running...';
    oldStart = performance.now();

    const rna = new_picture(size, seed);
    for (var j=0; j < resolution; j++) {
        setTimeout(paintOldPictureLine(rna, j), 0);
    }
}

async function paintNewPicture(size, seed) {
    const webglStart = performance.now();

    const picture = compute.random_picture(size, seed);
    document.getElementById("genomeListingBox").innerHTML = picture.gene_listing;
    document.getElementById("dnaSize").placeholder = picture.params.size;
    const shader = glsl.create_shader(picture);

    var canvas = document.getElementById("webglCanvas");
    webglRenderFrag(shader, canvas);

    const webglEnd = performance.now();
    webglCanvasPerformance.innerHTML = `${(webglEnd-webglStart).toFixed(2)} ms`;

    return shader;
}

var glslSource;
async function submitJob() {
    const [size, seed] = getJobParameters();
    lastSubmittedJob = [size, seed];

    document.getElementById("filename").placeholder = makeFilename(size, seed);

    paintOldPicture(size, seed);
    glslSource = await paintNewPicture(size, seed);
}

var exportMessage = document.getElementById("exportMessage");

function copyGlslSource() {
    if (glslSource) {
        navigator.clipboard.writeText(glslSource);
        exportMessage.innerHTML = "Copied to clipboard!";
    } else {
        exportMessage.innerHTML = "Paint a picture first!";
    }
}

function makeFilename(size, seed) {
    var filename = seed + " - " + size;
    return filename.replaceAll(/\*|\/|\\|\||\+|:|<|>|\?|,|\.|;|=|\[|\]/g, "_");
}

function getFilename() {
    var name = document.getElementById("filename").value;
    if(name)
        return name;
    else
        return document.getElementById("filename").placeholder;
}

function saveGlslSource() {
    if (glslSource) {
        const dataURL = "data:text/plain;charset=utf-8," + encodeURIComponent(glslSource);
        download(`${getFilename()}.frag`, dataURL);
        exportMessage.innerHTML = "Download started...";
    } else {
        exportMessage.innerHTML = "Paint a picture first!";
    }
}

function savePicture() {
    if (glslSource) {
        exportMessage.innerHTML = "Rendering...";
        setTimeout(savePictureAux, 50);
    } else {
        exportMessage.innerHTML = "Paint a picture first!";
    }
}

async function savePictureAux() {
    var width = parseInt(document.getElementById("imageWidth").value);
    width = width ? width : parseInt(document.getElementById("imageWidth").placeholder);
    var height = parseInt(document.getElementById("imageHeight").value);
    height = height ? height : parseInt(document.getElementById("imageHeight").placeholder);

    var canvas = createCanvas(width, height);
    await webglRenderFrag(glslSource, canvas);

    download(`${getFilename()}.png`, canvas.toDataURL("image/png"));
    exportMessage.innerHTML = "Done!"
}

function download(filename, dataURL) {
    var element = document.createElement('a');
    element.setAttribute('href', dataURL);
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }

  function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    return canvas;
}