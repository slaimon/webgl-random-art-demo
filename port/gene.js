import * as util from "./util.js"
import * as list from "./list.js"
import { operatorList } from "./operator-objects.js"

export {
         get_op,
         get_connectors,
         get_sort,

         random_foci,
         random_scalars,
         random_palette,
         random_gene,

         optimize,
         string_of_gene
}

function array_to_list(a) {
   if(a.length === 0) return 0;
   
   return [a[0], array_to_list(a.slice(1))];
}

// getters
// avrebbe senso trasformare il tipo di l in una classe
function get_op(l) { return l[0]; }
function get_connectors(l) { return l[1]; }

// restituisce una lista di tutti gli operatori che hanno campo retval === type
function get_sort(type, array_of_ops) {
   var result = array_of_ops.filter(
     (f) => f[0].retval === type,
     array_of_ops
   );
   
   if(!result) {
      console.log(`gene.get_sort: no operator of return type ${s} found in list.`);
      throw new Error(`gene.get_sort: not found!`);
   } 
      
   return array_to_list(result);
 }


// controlla se l'operatore f è compatibile con il gene
// un gene è una lista ocaml di operatori (?)
// f è compatibile con g sse tutti gli output di g hanno 
// almeno un input uguale in f
function connectible(f, gene) {
   return f.argv.every(s => {
                 return list.exists(
                   function (link) { return (s === link[0].retval); },
                   gene
                 );
               });
 }

// crea una lista di punti casuali con coordinate in [-1, 1]
function random_foci(n) {
   return util.map_range(
      function (a) {
        var x = util.rnd_float(-1.0, 1.0);
        var y = util.rnd_float(-1.0, 1.0);
        return [x, y];
      }, 1, n);
 }

// crea una lista di n float casuali in [-1,1]
function random_scalars(n) {
    return util.map_range(
        function (a) { return util.rnd_float(-1.0, 1.0); },
        1, n);
};

function random_palette(n) {
   var p = util.map_range(function (param) { return util.rnd_color(0); }, 1, n);
   var k = util.rnd_int(-15, 15);
   var h = 0.1;
   return util.nest(function (p) {
        return list.map(function (c) {
             var match = util.palette_force(c, p);
             return [
               c[0] + h * match[0],
               c[1] + h * match[1],
               c[2] + h * match[2]
             ];
           }, p);
      }, p, k);
 }

// connect(f, lst):
// per ogni argomento di f, restituisce un operatore scelto casualmente
// tra quelli che hanno quel tipo di output
function connect(f, lst) {
   var array_of_ops = list.to_array(lst);
   var connectors = f.argv.map( (type) => { return util.pick_exp(0.2, get_sort(type, array_of_ops)); } );
   
   connectors = array_to_list(connectors);
   
   return [f, connectors];
 }

function random_gene(ops, seed, res, k) {
    function make(j, lst, lst1) {
      if (j <= 1) {
          var ops1 =
            list.find_all(function (f) { return connectible(f, lst1); }, ops);
          var fs =
            list.find_all(
              function (f) { return list.mem(f.retval, res); },
              ops1
            );
          if (fs) return [connect(util.pick(fs), lst1), lst];
          if (j < -k - 5)
            return list.append(random_gene(operatorList, lst1, res, j), lst);
          let new_link = connect(util.pick(ops1), lst1);
          return make(j - 1, [new_link, lst], [new_link, lst1]);
      }
      var f = util.pick(ops);
      if (connectible(f, lst1)) {
          let new_link = connect(f, lst1);
          return make(j - 1, [new_link, lst], [new_link, lst1]);
      }
      var match =
        list.fold_right(function (p1, p2) {
             let arg_f = p1[0];
             let choice = p1[1];
             var g = random_gene(ops, lst1, [arg_f, 0], choice);
             if (g)
               return [
                 p2[0] - list.len(g),
                 [g[0], p2[1]],
                 list.append(g, p2[2]),
                 list.append(g, p2[3])
               ];
             throw new Error("[Match_failure, [\"gene.ml\", 101, 7]]");
           }, list.combine(
          array_to_list(f.argv), // shallow copy in caso desse problemi TODO
          util.rnd_partition(util.rnd_int(1, j - 1), f.argv.length)
        ), [j, 0, lst, lst1]);
      var c = [f, match[1]];
      return make(match[0], [c, match[2]], [c, match[3]]);
    }

 return make(k, 0, seed);
}

function optimize(g) {
   
   function coll(acc, param) {
        if (param) {
          {
            var cs = param[1];
            var c = param[0];
            if (list.mem(c, acc)) return coll(acc, cs);     // usava memq
            return coll(collect(acc, c), cs);
          }
        }
        return acc;
      }
   
   function collect(acc, lnk) {
        return coll(util.unionq(lnk, acc), get_connectors(lnk));
   }

   var used = collect(0, list.hd(g));
   return list.find_all(function (l) { return list.mem(l, used); }, g);    // usava memq
}

// returns the index of the leftmost link in g with the given operator as key
function index_of_link(connector, array_g) {
   let i = 0;
   for(const link of array_g) {
      if(link === connector) return i;
      i++;
   }
   
   throw new Error(`index_of_link: operator ${connector.name} not found in array gene ${JSON.stringify(array_g)}`);
}

function string_of_gene(g) {
   let str = "";
   
   let array_g = list.to_array(g);
   let enumerate_g = array_g.entries();
   
   // print the index and operator name for each link
   for(const [i, link] of enumerate_g){
      let args = "";
      let connectors = list.to_array(get_connectors(link));
      
      // print the link index for each connector in the link
      for (const [j, connector] of connectors.entries()) {
         args = args + index_of_link(connector, array_g);
         if (j !== connectors.length-1) 
            args = args + ",";
      }
      
      // example: "0: cmix (6, 2, 1)"
      str += `${i}: ${get_op(link).name} (${args})`;
      
      if(i<array_g.length-1)
         str += '\n';
   }
   
   return str;
}