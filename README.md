# Making it faster... by 100x

I was fascinated by [random-art.org](https://www.random-art.org/?sort=popularity), but I found it frustratingly slow. So I reverse-engineered it and rewrote it to use webGL as a rendering engine. This is the result.

It's just a proof of concept. My original idea for this project was much broader and I'd still like to make it real someday in the future.

## Running the demo

The demo is available at the [project page](https://slaimon.github.io/webgl-random-art-demo). Just type any string in the Controls box and click Paint, just like the original website. 

There are two canvases, side by side: one uses the original JS renderer and the other, written by me, uses WebGL. The rendering times are shown underneath so you can see that it's cut by 50 to 100 times!

In this version of the toy you can also customize the DNA size (a measure of the image complexity) and a wider range of image seeds are accepted. You can even render the empty string!

If you experience problems of any kind, or you have suggestions to improve the UI, you're welcome to open an issue. If the webgl renderer shows a different image from the one in the old renderer, it would be really helpful if you could add its seed and size to `conflicts.txt`.

## Tools I used

The original website has a client-side JS renderer; however it's not trivial code because it was transpiled from OCaml.

I used [jscodeshift](https://github.com/facebook/jscodeshift) and [acornjs](https://github.com/acornjs/acorn/) to turn the obfuscated javascript into readable pseudocode, then adjusted it by hand. It was a very fun and challenging exercise in problem solving!

## Backlog

* refactor `main.js`
* refactor `old/gene.js` and `old/compute.js` while trying not to break compatibility
* check for memory leaks and other performance issues (the page seems to slow down immensely after a few images are exported)
* if the old canvas is still busy while the form is submitted, the worker should drop the old job and take on the new one
* turn the checkbox into a toggleswitch using css black magic
