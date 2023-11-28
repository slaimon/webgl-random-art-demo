import * as list from "./list.js"
import * as util from "./util.js"
import * as gene from "./gene.js"

import { operatorList, leafNodePT, leafNodeT } from "./operator-objects.js"

export {
   compile,
   random_picture,
   get_gene_listing
}

var default_color = util.color_of_rgb(0.0, 0.0, 0.0);
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

function make_env(seed_string) {
   util.prng_init(seed_string);
   var scalars = gene.random_scalars(10);
   var foci = gene.random_foci(util.rnd_int(5, 20));
   var palette =
     [util.color_of_rgb(-1.0, -1.0, -1.0), [
       util.color_of_rgb(1.0, 0.0, 1.0),
       gene.random_palette(util.rnd_int(2, 10))
     ]];
   
   return {
      foci: foci,
      scalars: scalars,
      palette: palette
   };
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
   
   var operators = reduce(operatorList);
   var seed = [leafNodePT, [leafNodeT, 0]];
   
   return { gene: gene.optimize(
                     list.append(
                        gene.random_gene(operators, seed, ["vec3", 0], size),
                        seed)),
            size: size
          };
}

function get_gene_listing(size, seed_string) {
   var [ _ , gene_seed] = util.split_name(seed_string);
   var new_gene = make_gene(size, gene_seed);
   
   return gene.string_of_gene(new_gene);
}

function random_picture(size, seed_string) {
   var [env_seed, gene_seed] = util.split_name(seed_string);
   
   var env = make_env(env_seed);
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