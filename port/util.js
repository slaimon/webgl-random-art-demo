import * as random from "./random.js"
import * as list   from "./list.js"

export {
         pi,
         mod_float,
         range,
         rgb_range,
         prob,
         rnd_int,
         rnd_float,
         split_name,
         nest,
         rnd_partition,
         map_range,
         pick_exp,
         pick,
         pick_many,
         unionq,
         color_of_rgb,
         rgb_of_color,
         rgb_of_hsl,
         rnd_color,
         rgb_force,
         palette_force,
         mix,
         mix3,
         mix4,
         minimize,
         prng_init,
         rng_counter
} 

var pi = Math.PI;

// a%b ma generalizzato ai float
function mod_float(a, b) {
     var x = a / b;
     var n = Math.floor(Math.abs(x));
     if (x >= 0.0) return a - n * b;
     return a + n * b;
   }

// f(f(...f(f(x))...)), n volte f
function nest(f, x, n) {
     if (n <= 0) return x;
     return f(nest(f, x, n - 1));
}



                  /////////////////////////////////////////////////
                  ///**    FUNZIONI DI GENERAZIONE CASUALE    **///


// inizializza il prng con una stringa!
function prng_init(str) {
  // se str != stringa vuota
  if (str !== '') {
    var n = str.length;
    var a = Array(n).fill(0);
    for (var i = 0; i <= n - 1; i++) {
      a[i] = i*i + str.charCodeAt(i);
    }
    return random.full_init(a);
  }
  // default seed
  return random.full_init([0]);
}

var rng_counter = 0;

// random probability
function prob() { rng_counter += 1; return random.float(1.0); }

// random number in interval
function rnd_int(a, b) { rng_counter += 1; return a + random.int(b - a + 1); }
function rnd_float(u, v) { rng_counter += 1; return u + random.float(v - u); }

// restituisce un sottoinsieme casuale di q elementi su un totale di k
// il sottoinsieme è rappresentato da una lista ocaml di k elementi
// di cui q sono pari a 1 e tutti gli altri 0 
function rnd_partition(q, k) {
  function inc(lst) {
     var n = lst[0];
     var flag = false;
     start: {
       if (n) { flag = true; break start; }
       var match1 = lst[1];
       if (!match1) { flag = true; break start; }
       return [match1[0] + 1, match1[1]];
     }
     if (flag) {
       {
         var match2 = lst[1];
         if (match2) return [match2[0], inc([n - 1, match2[1]])];
         throw new Error("util.rnd_partition: an impossible thing happened");
       }
     }
  }

  return nest(function (is) {
        var r = rnd_int(0, k - 1);
        return inc([r, is]);
      }, nest(function (zs) { return [0, zs]; }, 0, k), q);
}




                  ////////////////////////////////////////////
                  ///**    FUNZIONI DI SCELTA CASUALE    **///


// random pick function with exponential distribution ??
function pick_exp(p, lst) {
  function pck(u, v, l) {
    if (l) {
       var xs = l[1];
       var x = l[0];
       if (!xs) return x;
       if (v <= u) return x;
       return pck(u * (1.0 - p), v - u, xs);
    }
    throw new Error("util.pick_exp: cannot pick from empty list");
  }

  var n = list.len(lst);
  var q = rnd_float(0.0, 1.0 - Math.pow(1.0 - p, n));
  return pck(p, q, lst);
}

// lst[rnd_int]
function pick(lst) { 
   if (list.len(lst) === 0)
      throw new Error("util.pick: cannot pick from empty list");
   return list.nth(lst, rnd_int(0, list.len(lst) - 1));
}

// crea una lista di n elementi scelti casualmente da lst, più uno 0 in coda
function pick_many(n, lst) {

   // porta l[n] in testa alla lista, fa scorrere tutti gli altri elementi
   function split(n, l) {
      if (l) {
         var xs = l[1];
         var x = l[0];
         if (n === 0) return [x, xs];
         var match = split(n - 1, xs);
         return [match[0], [x, match[1]]];
      }
      throw new Error("util.pick_many: match failure");
   }
  
   // sceglie n elementi casuali da lst
   function pck(n, lst, xs) {
      if (n === 0) return xs;
      var k = rnd_int(0, list.len(lst) - 1);
      var match = split(k, lst);
      return pck(n - 1, match[1], [match[0], xs]);
   }
  
   if(list.len(lst) === 0)
      throw new Error("util.pick_many: cannot pick from empty list");
   
   if(n > list.len(lst) || Number.isNaN(n))
      throw new Error(`util.pick_many: cannot pick ${n} elements from a list of length ${list.len(lst)}`);
   
   // la lista ocaml casuale contiene n elementi
   return pck(n, lst, 0);
}

// divide la stringa in due parti, prima e dopo la prima occorrenza di ' '
// il primo spazio nella stringa viene consumato, gli altri no
// se non ci sono occorrenze, restituisce [str+' ', str]
// (il primo membro della lista non contiene mai spazio, 
// A MENO CHE la stringa originale non ne contenesse nessuno. probabile bug)
function split_name(str) {
  var k = str.indexOf(' ');
  if (k != -1) {
      return [
          str.slice(0, k),
          str.slice(k + 1)
      ];
  } else {
      return [str+' ', str];
  }
};

// restituisce un array fatto più o meno così:
// [f(a), [f(a+1), [f(a+2), ... [f(b-1), [f(b), 0]] ... ]]]
// in altre parole: una lista stile ocaml che corrisponde a
// [f(a), f(a+1), f(a+2), ... f(b-1), f(b), 0]
// TODO viene usato in diverse funzioni di Gene
function map_range(f, a, b) {
  if (a > b) return 0;
  var x = f(a);
  var xs = map_range(f, a + 1, b);
  return [x, xs];
}

// appends x to the end of the list iff no element in lst is === x
function unionq(x, lst) {
  if (lst) {
    var y = lst[0];
    if (x === y) return lst;
    return [y, unionq(x, lst[1])];
  }
  return [x, 0];
}




            /////////////////////////////////////
            ///**    FUNZIONI SUI COLORI    **///


// si spiega da sé
function color_of_rgb(r, g, b) { return [r, g, b]; }

// ???
function range(a, b, min, max, x) {
   if (a === 0 && b === 0) {
      a = -1;
      b =  1;
   }
   return max -
            (max - min) *
              Math.abs(mod_float(Math.abs(x - a), 2.0 * (b - a)) / (b - a) - 1.0);
 }

// converte x da (-inf,+inf) a un intervallo scelto (default [-1,1])
// gli argomenti opt_min, opt_max vanno dati sotto forma di array
function rgb_range(opt_min, opt_max, x) {
   var min = opt_min ? opt_min[0] : -1.0;
   var max = opt_max ? opt_max[0] : 1.0;
   return min + (max - min) * (0.5 + Math.atan(2.0 * x) / pi);
 }

// converte un vec3 da (-inf, +inf) a [0,255]
function rgb_of_color(color) {
   return [
     rgb_range([0.0], [255.0], color[0]) >> 0,    // shifting by 0 truncates to 32-bit integer
     rgb_range([0.0], [255.0], color[1]) >> 0,
     rgb_range([0.0], [255.0], color[2]) >> 0
   ];
 }

// anche questa si spiega da sé, ma andrebbe testata per scoprire
// se ci sono quirk di implementazione da replicare
// TODO in caso ci siano problemi di replicazione delle immagini
// viene usata soltanto nell'operatore hsl, questo può essere utile
// per cercare di isolare eventuali problemi
function rgb_of_hsl(h, sl, l) {
   var v = l <= 0.5 ? l * (1.0 + sl) : l + sl - l * sl;
   if (v <= 0.0) return [0.0, 0.0, 0.0];
   var m = l + l - v;
   var sv = (v - m) / v;
   var h6 = Math.abs(h * 6.0);
   var sextant = (h6 >> 0) % 6;
   var fract = h6 - Math.floor(h6);
   var vsf = v * sv * fract;
   var mid1 = m + vsf;
   var mid2 = v - vsf;
   if (sextant < 0 || sextant > 4) return [v, m, mid2];
   switch (sextant)
   {
   case 0: return [v, mid1, m];
   case 1: return [mid2, v, m];
   case 2: return [m, v, mid1];
   case 3: return [m, mid2, v];
   case 4: return [mid1, m, v];
   default: return null;
   }
 }

// random color in the rgb [0,255] range
function rnd_color(param) {
   var r = rnd_float(-1.0, 1.0);
   var g = rnd_float(-1.0, 1.0);
   var b = rnd_float(-1.0, 1.0);
   return color_of_rgb(r, g, b);
 }

// interessante funzione che da due colori diversi ne fa uno nuovo
function rgb_force(color_1, color_2) {
   var dr = color_1[0] - color_2[0];
   var dg = color_1[1] - color_2[1];
   var db = color_1[2] - color_2[2];
   var d2 = 1.0 / (dr * dr + dg * dg + db * db);
   return [dr * d2, dg * d2, db * d2];
 }

// equivale a mix(c2, c1, t) in glsl
function mix(t, c1, c2) {
   var u = 1.0 - t;
   return [
     t * c1[0] + u * c2[0],
     t * c1[1] + u * c2[1],
     t * c1[2] + u * c2[2]
   ];
 }

// generalizzazione di mix per 3 colori (con 2 parametri)
function mix3(u, v, c1, c2, c3) {
   var w = 1.0 - u - v;
   return [
     u * c1[0] + v * c2[0] + w * c3[0],
     u * c1[1] + v * c2[1] + w * c3[1],
     u * c1[2] + v * c2[2] + w * c3[2]
   ];
 }

// come sopra, ma per 4 colori
function mix4(u, v, w, c1, c2, c3, c4) {
   var t = 1.0 - u - v - w;
   return [
     u * c1[0] + v * c2[0] + w * c3[0] + t * c4[0],
     u * c1[1] + v * c2[1] + w * c3[1] + t * c4[1],
     u * c1[2] + v * c2[2] + w * c3[2] + t * c4[2]
   ];
 }

// trova il valore in lst che minimizza la funzione f
// viene usata nella definizione di due operatori
function minimize(f, lst) {
  function m(y, v, l) {
     if (l) {
       {
         var xs = l[1];
         var x = l[0];
         var w = f(x);
         // isNaN serve a emulare il comportamento di caml_lessthan
         // per caml, x<NaN è sempre vera; per js è sempre falsa.
         if (v < w || isNaN(w)) return m(y, v, xs);
         return m(x, w, xs);
       }
     }
     return y;
   }

  if (lst) {
    var x = lst[0];
    return m(x, f(x), lst[1]);
  }
  throw new Error("util.minimize: empty list");
}





      ////***   FUNZIONI DA TRASLOCARE   ***////
      
      // funzioni che vanno spostate in
      // qualche altro modulo


// opera una qualche trasformazione sulla lista (stile ocaml)
// di colori p, parametrizzata sul colore c
// TODO viene usata solo in Gene.random_palette
function palette_force(c, p) {
 return list.fold_left(
   function (color, d) {
      var z = color[2];
      var y = color[1];
      var x = color[0];
      if (d === c) return [x, y, z];   // TODO In caso di problemi, qui c'era un caml_equal
      var match = rgb_force(c, d);
      return [x + match[0], y + match[1], z + match[2]];
    },
    [0.0, 0.0, 0.0], p);
}