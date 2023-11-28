export {submitJob, toggleOldRenderer}

import {new_picture, compute_pixel} from "./old/gen.js"
import {webglRenderFrag} from "./webgl.js"
import * as compute from "./port/compute.js"
import * as glsl from "./port/glsl/glsl.js"

function jobDescription(jobParams) {
    const [size, seed] = jobParams;
    var description = `seed:"${seed}"`;
    if(size !== undefined) {
        description += `, size: "${size}"`
    }
    return `(${description})`;
}

function getJobParameters() {
    const seed = document.getElementById("seed").value;
    var size = parseInt(document.getElementById("dnaSize").value);
    if(!size) size = undefined;

    return [size, seed];
}

var useOldRenderer = true;
var lastSubmittedJob = undefined;
function toggleOldRenderer() {
    var toggle =  document.getElementById("oldRendererToggle");

    useOldRenderer = !useOldRenderer;
    if(useOldRenderer && lastSubmittedJob !== undefined) {
        const [size, seed] = lastSubmittedJob;
        paintOldPicture(size, seed);
    }
}

const canvas = document.getElementById("oldCanvas");
const resolution = parseInt(canvas.getAttribute("width"));
const ctx = canvas.getContext("2d");

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
            console.log(`OLD ${jobDescription(lastSubmittedJob)} : ${((oldEnd-oldStart)/1000.0).toFixed(2)} seconds`);
        }
    }
}

async function paintOldPicture(size, seed) {
    if (!useOldRenderer) {
        return;
    }
    oldStart = performance.now();

    const rna = new_picture(size, seed);
    for (var j=0; j < resolution; j++) {
        setTimeout(paintOldPictureLine(rna, j), 0);
    }
}

async function paintNewPicture(size, seed) {
    const picture = compute.random_picture(size, seed);
    const shader = glsl.create_shader(picture);
    webglRenderFrag(shader);

    return shader;
}

async function submitJob() {
    const [size, seed] = getJobParameters();
    lastSubmittedJob = [size, seed];

    paintOldPicture(size, seed);
    

    const webglStart = performance.now();
    
    document.getElementById("genomeListingBox").innerHTML = compute.get_gene_listing(size, seed);
    document.getElementById("glslCodeBox").innerHTML = await paintNewPicture(size, seed);
    
    const webglEnd = performance.now();
    console.log(`WEBGL ${jobDescription(lastSubmittedJob)} : ${(webglEnd-webglStart).toFixed(2)} milliseconds`);
}