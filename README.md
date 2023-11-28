# Porting random-art.org to webgl

This is just a proof of concept. I was fascinated by the website and wanted to develop the idea behind it to its full potential. The first step was rewriting it from scratch, using webGL as a rendering engine. This is the result.

## Running the demo

Just download the repo and open it in VScode. I use the extension Live Server by Ritwick Dey to run it on my computer.
The interface is pretty self-explainatory, I hope.

## Backlog

* refactor `main.js`, maybe use web workers
* refactor `old/gene.js` and `old/compute.js` while trying not to break compatibility
* if the old canvas is still busy while the form is submitted, the worker should drop the old job and take on the new one
* instead of `console.log`ing the performance info I should print it directly on the webpage
* turn the checkbox into a toggleswitch using css black magic