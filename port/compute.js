import * as list from "./list.js"
import * as util from "./util.js"
import * as gene from "./gene.js"

import { operatorList, leafNodePT, leafNodeT } from "./operator-objects.js"

export {
   compile,
   random_picture,
   get_gene_listing,
   get_default_size
}

var default_color = [0.0, 0.0, 0.0];
var random_choices = {};

// returns a predetermined value based on the type of operator output:
function defaultValue(type) {
  switch (type)
  {
  case "bool":  return [false];
  case "float": return [0.7];
  case "vec2":  return [0.2, 0.3];
  case "vec3":  return [default_color];
  default: return null;
  }
}

function make_cell(cells, f, env) {
   var choices;
   if (f.choices) {
      try {
      choices = f.choices(env, cells);
      } catch(e) {
         throw new Error(`compute.make_cell: operator ${f.name} encountered an error while choosing its random parameters`, {cause:e});
      }
      if(random_choices[f.name] === undefined) {
         random_choices[f.name] = [];
      }
      let instanceId = Object.keys(random_choices[f.name]).length;
      for (const choice of choices) {
         choice.instanceId = instanceId;
      }
      random_choices[f.name].push(choices);
   }
   else choices = null;

   return [
            [defaultValue(f.retval)],
            choices
          ];
}

function compile(rna, env) {
  function cmpl(g) {
       if (g) {
         var link = g[0];          // link = [op, connectors]
         var match = cmpl(g[1]);   // match = compile(g[1], env)
         var asc = match[1];
         var cell =
           make_cell(
             list.map( (r) => list.assq(r, asc),
                        gene.get_connectors(link) ),  // cells
             gene.get_op(link),  // f
             env);               // env
         return [[cell, match[0]], [[link, cell], asc]];
       }
       return [0, 0];
     }

  return cmpl(rna)[0];
}

// sceglie casualmente almeno 1+floor(n/5) degli elementi nella lista fs
function reduce(fs) {
   var n = list.len(fs);
   var new_len = util.rnd_int(1 + (n / 5 >> 0), n);
   return util.pick_many(new_len, fs);
 }

function make_gene(size, seed_string) {
   util.prng_init(seed_string);
   if(size === undefined || size === 0)
      size = util.rnd_int(120, 200);
   else
      util.rnd_int(120, 200);
   
   const operators = reduce(operatorList);
   const seed = [leafNodePT, [leafNodeT, 0]];
   const g = gene.optimize(
                  list.append(
                     gene.random_gene(operators, seed, ["vec3", 0], size),
                     seed));
   
   return { gene: g,
            size: size };
}

function get_default_size(seed_string) {
   var [ _ , gene_seed ] = util.split_name(seed_string);
   util.prng_init(gene_seed);

   return util.rnd_int(120,200);
}

function get_gene_listing(size, seed_string) {
   var [ _ , gene_seed] = util.split_name(seed_string);
   var new_gene = make_gene(size, gene_seed);
   
   return gene.string_of_gene(new_gene);
}

function random_picture(size, seed_string) {
   var [env_seed, gene_seed] = util.split_name(seed_string);
   
   var env = new Environment(env_seed);
   var g = make_gene(size, gene_seed);
   compile(g.gene, env);
   
   // resetto la variabile globale
   const choices = random_choices;
   random_choices = {};
   
   return { gene_listing: gene.string_of_gene(g.gene),
            choices: choices,
            params: {
               seed: seed_string,
               size: g.size
            }
          };
}

class Environment {
   constructor(seed) {
      util.prng_init(seed);
      this.scalars = this.#random_scalars(10);
      this.foci = this.#random_foci(util.rnd_int(5, 20));
      this.palette =
            [ [-1.0, -1.0, -1.0], 
            [ [1.0, 0.0, 1.0],
               this.#random_palette(util.rnd_int(2, 10))
            ]];
   }

   // restituisce un array fatto più o meno così:
   // [f(a), [f(a+1), [f(a+2), ... [f(b-1), [f(b), 0]] ... ]]]
   // in altre parole: una lista stile ocaml che corrisponde a
   // [f(a), f(a+1), f(a+2), ... f(b-1), f(b)]
   #map_range(f, a, b) {
      if (a > b) return 0;
      var x = f(a);
      var xs = this.#map_range(f, a + 1, b);
      return [x, xs];
   }
 
   // crea una lista di punti casuali con coordinate in [-1, 1]
   #random_foci(n) {
      return this.#map_range(
         function (a) {
            var x = util.rnd_float(-1.0, 1.0);
            var y = util.rnd_float(-1.0, 1.0);
            return [x, y];
         }, 1, n);
   }

   // crea una lista di n float casuali in [-1,1]
   #random_scalars(n) {
      return this.#map_range(
            function (a) { return util.rnd_float(-1.0, 1.0); },
            1, n);
   };

   #random_palette(n) {
      // interessante funzione che da due colori diversi ne fa uno nuovo
      function rgb_force(color_1, color_2) {
      var dr = color_1[0] - color_2[0];
      var dg = color_1[1] - color_2[1];
      var db = color_1[2] - color_2[2];
      var d2 = 1.0 / (dr * dr + dg * dg + db * db);
      return [dr * d2, dg * d2, db * d2];
      }

      // opera una qualche trasformazione sulla lista (stile ocaml)
      // di colori p, parametrizzata sul colore c
      function palette_force(c, p) {
      return list.fold_left(
         function (color, d) {
            var z = color[2];
            var y = color[1];
            var x = color[0];
            if (d === c) return [x, y, z];
            var match = rgb_force(c, d);
            return [x + match[0], y + match[1], z + match[2]];
         },
         [0.0, 0.0, 0.0], p);
      }

      var p = this.#map_range(function (param) { return util.rnd_color(); }, 1, n);
      var k = util.rnd_int(-15, 15);
      var h = 0.1;
      return util.nest(function (p) {
            return list.map(function (c) {
               var match = palette_force(c, p);
               return [
                  c[0] + h * match[0],
                  c[1] + h * match[1],
                  c[2] + h * match[2]
               ];
               }, p);
         }, p, k);
   }
}