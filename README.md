# Porting random-art.org to webgl

This is just a proof of concept. I was fascinated by the [original website](https://www.random-art.org/) and wanted to develop the idea behind it to its full potential. The first step was rewriting it from scratch, using webGL as a rendering engine. This is the result.

## Running the demo

The demo is available at the [project page](https://slaimon.github.io/webgl-random-art-demo).

Just type the image seed in the Controls box and click Paint, just like the original website. *Unlike* the original website, however, you can customize the DNA size (a measure of the image complexity) and a wider range of image seeds are accepted. You can even render the empty string!

If you experience problems of any kind, or you have suggestions to improve the UI, you're welcome to open an issue. If the webgl renderer shows a different image from the one in the old renderer, it would be really helpful if you could add its seed and size to `conflicts.txt`.

## Backlog

* refactor `main.js`
* refactor `old/gene.js` and `old/compute.js` while trying not to break compatibility
* check for memory leaks and other performance issues (the page seems to slow down immensely after a few images are exported)
* if the old canvas is still busy while the form is submitted, the worker should drop the old job and take on the new one
* turn the checkbox into a toggleswitch using css black magic
