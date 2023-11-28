export { webglRenderFrag }

var gl;
var canvas;
var buffer;
var program;
var uniformResolutionLocation;

const vertexShaderSource = 
`attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0, 1);
}`

function makeProgram(gl, fragmentShaderSource) {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    uniformResolutionLocation = gl.getUniformLocation(program, "u_resolution");
    return program;
}
function makeBuffer(gl) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0  ]),
        gl.STATIC_DRAW
    );
}

function render() {
    window.requestAnimationFrame(render, canvas);

    var positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(uniformResolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function webglRenderFrag(fragmentShaderSource) {
    canvas = document.getElementById("webglCanvas");
    gl = canvas.getContext("experimental-webgl");
    gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight);

    buffer = makeBuffer(gl);
    program = makeProgram(gl, fragmentShaderSource);
    render();
}