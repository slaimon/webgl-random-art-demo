import * as list from "./list.js"
import * as util from "./util.js"

/*
   un operatore è un oggetto {name, nargs, nres, fun} dove:
      - name è una stringa che ne rappresenta il nome
      - argv è un vettore che elenca i tipi degli argomenti che accetta
      - retval è il tipo di valore che restituisce
      - choices è una funzione che restituisce un array di oggetti Choice,
      ciascuno dei quali rappresenta la scelta di un valore per un parametro casuale
*/

export {
  operatorList,
  palette_pf,
  palette_pp,
  scalar,
  pmult,
  fold,
  protfold,
  dist,
  rotate,
  discretize,
  ftimes,
  fatan,
  inrange,
  pfoci,
  pclosestmax,
  fclosest,
  torus,
  bor,
  band,
  fif,
  pif,
  cif,
  bw,
  hsl,
  rgb,
  rgbv,
  saturate,
  negative,
  fless,
  fmax,
  fmix,
  pmix,
  cmix,
  fplus,
  pplus,
  pt,
  t,
  leafNodePT,
  leafNodeT
}

/*
  gli oggetti di tipo Choice rappresentano la scelta di un valore per un parametro casuale,
  riferita ad un dato parametro di un dato operatore (es. "il parametro t dell'operatore protfold che compare alla riga 15")
  Le funzioni choices NON settano l'istanceId (che permette di risalire a quale riga del listato appartenga la Choice)
  perché non hanno accesso a questa informazione, perciò tale campo deve essere settato manualmente al momento della compilazione
  (infatti viene settato da compute.make_cell che viene chiamata da compute.compile).
*/
class Choice {
   constructor(operator, type, name, value) {
      this.operator = operator;
      this.name = name;
      this.instanceId = null;
      this.type = type;
      this.value = value;
      
      if(type.split(' ')[1] === "array")
         this.isArray = true;
      else
         this.isArray = false;
   }
}

var palette_pf = {
  name: "palette_pf",
  argv: ["vec2", "float"],
  retval: "vec3",
  choices: function (env, argv) {
               var choice_palette = new Choice("palettepf", "vec3 array", "palette", list.to_array(util.pick_many(3, env.palette)))
               
               return [ choice_palette ];
           }
};
var palette_pp = {
  name: "palette_pp",
  argv: ["vec2", "vec2"],
  retval: "vec3",
  choices: function (env, argv) {
               var choice_palette = new Choice("palettepp", "vec3 array", "palette", list.to_array(util.pick_many(4, env.palette)))
               return [ choice_palette ];
           }
};
var scalar = {
  name: "scalar",
  argv: ["vec2"],
  retval: "float",
  choices: function (env, argv) {
               var random_point = util.pick(env.foci);
               var phi = 2.0 * Math.PI * util.pick(env.scalars);
               
               var choice_rnd = new Choice("scalar", "vec2", "rnd_point", random_point);
               var choice_phi = new Choice("scalar", "float", "phi", phi);
               
               return [ choice_rnd, choice_phi ];
           }
};
var pmult = {
  name: "pmult",
  argv: ["vec2", "vec2"],
  retval: "vec2",
  choices: function (env, argv) {
               var choice_rnd = new Choice("pmult", "vec2", "rnd_point", util.pick(env.foci));
               
               return [ choice_rnd ];
           }
};
var protfold = {
  name: "protfold",
  argv: ["vec2", "vec2"],
  retval: "vec2",
  choices: function (env, argv) {
               var t = Math.PI / Math.ceil(util.range(0, 0, 1.5, 12.0, util.pick(env.scalars) ));
               var choice_t = new Choice("protfold", "float", "t", t);
               
               return [ choice_t ];
           }
};
var fold = {
  name: "fold",
  argv: ["vec2", "vec2", "float"],
  retval: "vec2",
  choices: function (env, argv) {
               var wgh1 = Math.max(0.0,
                                   util.range(0, 0, -1.1, 0.3, util.pick(env.scalars)));
               var wgh2 = Math.max(0.0,
                                   util.range(0, 0, -1.1, 0.3, util.pick(env.scalars)));
               
               var rnd_point = util.pick(env.foci);
               var x1 =  (1.0 - wgh1) * rnd_point[0];
               var y1 =  (1.0 - wgh1) * rnd_point[1];
               var phi = (1.0 - wgh2) * 2.0 * Math.PI * util.pick(env.scalars);
               
               var choice_phi = new Choice("fold", "float", "phi", phi);
               var choice_rnd = new Choice("fold", "vec2", "rnd_point", [x1, y1]);
               var choice_weights = new Choice("fold", "vec2", "weights", [wgh1, wgh2]);
               
               return [ choice_rnd, choice_weights, choice_phi ];
           }
};
var dist = {
  name: "dist",
  argv: ["vec2", "vec2"],
  retval: "float",
  choices: function (env, argv) {
               var weight = Math.max(0.0,
                                     util.range(0, 0, -0.2, 0.5, util.pick(env.scalars)));
               var random_point = util.pick(env.foci);
               var x1 = (1.0 - weight) * random_point[0];
               var y1 = (1.0 - weight) * random_point[1];
               
               var choice_rnd = new Choice("dist", "vec2", "rnd_point", [x1, y1]);
               var choice_weight = new Choice("dist", "float", "weight", weight);
               
               return [ choice_rnd, choice_weight ];
  }
};
var rotate = {
  name: "rotate",
  argv: ["vec2", "vec2", "float"],
  retval: "vec2",
  choices: function (env, argv) {
               var wgh1 = Math.max(0.0,
                                   util.range(0, 0, -0.5, 0.3, util.pick(env.scalars)));
               var wgh2 = Math.max(0.0,
                                   util.range(0, 0, -0.5, 0.3, util.pick(env.scalars)));
               
               var rnd_point = util.pick(env.foci);
               rnd_point[0] = rnd_point[0] * (1.0 - wgh1);
               rnd_point[1] = rnd_point[1] * (1.0 - wgh1);
               
               var phi = 2.0 * Math.PI * (1.0 - wgh2) * util.pick(env.scalars);
               
               var choice_weights = new Choice("rotate", "vec2", "weights", [wgh1, wgh2]);
               var choice_rnd = new Choice("rotate", "vec2", "rnd_point", rnd_point);
               var choice_phi = new Choice("rotate", "float", "phi", phi);
               
               return [ choice_weights, choice_rnd, choice_phi ];
           }
};
var discretize = {
  name: "discretize",
  argv: ["vec2", "vec2"],
  retval: "vec2",
  choices: function (env, argv) {
               var random_point = util.pick(env.foci);
               var random_float = Math.max(0.0,
                                           util.range(0, 0, -0.1, 0.8, util.pick(env.scalars)));
               
               var a = 0.1 * (1.0 - random_float) * random_point[0];
               var b = 0.1 * (1.0 - random_float) * random_point[1];
               
               var choice_rnd_point = new Choice("discretize", "vec2", "rnd_point", [a, b]);
               var choice_rnd_float = new Choice("discretize", "float", "rnd_float", random_float);
               
               return [ choice_rnd_point, choice_rnd_float ];
           }
};
var ftimes = {
  name: "ftimes",
  argv: ["float", "float"],
  retval: "float",
  choices: function (env, argv) {
               var choice_rnd = new Choice("ftimes", "vec2", "rnd_point", util.pick(env.foci));
               
               return [ choice_rnd ];
           }
};
var fatan = {
  name: "fatan",
  argv: ["float"],
  retval: "float",
  choices: function (env, argv) {
               var random_scalars = util.pick_many(2, env.scalars);
               var alpha = util.range(0, 0, 0.1, 10.0, random_scalars[0]);
               
               var choice_rnd = new Choice("fatan", "float", "rnd", random_scalars[1][0]);
               var choice_alpha = new Choice("fatan", "float", "alpha", alpha);
               
               return [ choice_rnd, choice_alpha ];
           }
};
var inrange = {
  name: "inrange",
  argv: ["float"],
  retval: "bool",
  choices: function (env, argv) {
               var random_point = list.to_array(util.pick_many(2, env.scalars));
   
               var a = Math.min(random_point[0], random_point[1]);
               var b = Math.max(a, random_point[1]);
               
               var choice_a = new Choice("inrange", "float", "a", a);
               var choice_b = new Choice("inrange", "float", "b", b);
               
               return [ choice_a, choice_b ];
           }
};
var pfoci = {
  name: "pfoci",
  argv: ["vec2", "vec2", "vec2"],
  retval: "vec2",
  choices: function (env, argv) {
               var min_length = Math.min(list.len(env.foci), list.len(env.scalars));
               var random_amount = util.rnd_int(2, min_length);
   
               var weight = Math.max(0.0,
                                     util.range(0, 0, -0.05, 0.5, util.pick(env.scalars)));
                                       
               var random_points = list.to_array(util.pick_many(random_amount, env.foci));
               var random_scalars = list.to_array(util.pick_many(random_amount, env.scalars));
               random_scalars = random_scalars.map(x => 0.1*x*x);
               
               var choice_weight = new Choice("pfoci", "float", "weight", weight);
               var choice_pts = new Choice("pfoci", "vec2 array", "rnd_points", random_points);
               var choice_scalars = new Choice("pfoci", "float array", "rnd_scalars", random_scalars);
               
               return [ choice_weight, choice_pts, choice_scalars ];
           }
};
var pclosestmax = {
  name: "pclosestmax",
  argv: ["vec2", "float"],
  retval: "vec2",
  choices: function (env, argv) {
               var n = list.len(env.foci);
               var amount = util.rnd_int(n/2 >> 0, n);
               var random_points = util.pick_many(amount, env.foci);
               
               var choice_rnd = new Choice("pclosestmax", "vec2 array", "rnd_points", list.to_array(random_points));
               
               return [ choice_rnd ];
           }
};
var fclosest = {
  name: "fclosest",
  argv: ["float", "float"],
  retval: "float",
  choices: function (env, argv) {
               var n = list.len(env.scalars);
               var amount = util.rnd_int(n/2 >> 0, n);
               var rnd_scalars = util.pick_many(amount, env.scalars);
               
               var choice_rnd = new Choice("fclosest", "float array", "rnd_scalars", list.to_array(rnd_scalars));
               
               return [ choice_rnd ];
           }
};



var torus = {
  name: "torus",
  argv: ["vec2", "float", "float"],
  retval: "vec2"
};
var bor = {
  name: "bor",
  argv: ["bool", "bool"],
  retval: "bool"
};
var band = {
  name: "band",
  argv: ["bool", "bool"],
  retval: "bool"
};
var fif = {
  name: "fif",
  argv: ["bool", "float", "float"],
  retval: "float"
};
var pif = {
  name: "pif",
  argv: ["bool", "vec2", "vec2"],
  retval: "vec2"
};
var cif = {
  name: "cif",
  argv: ["bool", "vec3", "vec3"],
  retval: "vec3"
};
var hsl = {
  name: "hsl",
  argv: ["vec2", "float"],
  retval: "vec3"
};
var bw = {
  name: "bw",
  argv: ["float"],
  retval: "vec3"
};
var rgb = {
  name: "rgb",
  argv: ["float", "float", "float"],
  retval: "vec3"
};
var rgbv = {
  name: "rgbv",
  argv: ["vec2", "vec2"],
  retval: "vec3"
};
var saturate = {
  name: "saturate",
  argv: ["vec3", "float"],
  retval: "vec3"
};
var negative = {
  name: "negative",
  argv: ["float"],
  retval: "bool"
};
var fless = {
  name: "fless",
  argv: ["float", "float"],
  retval: "bool"
};
var fmax = {
  name: "fmax",
  argv: ["float", "float"],
  retval: "float"
};
var fmix = {
  name: "fmix",
  argv: ["float", "float", "float"],
  retval: "float"
};
var pmix = {
  name: "pmix",
  argv: ["vec2", "vec2", "float"],
  retval: "vec2"
};
var cmix = {
  name: "cmix",
  argv: ["float", "vec3", "vec3"],
  retval: "vec3"
};
var fplus = {
  name: "fplus",
  argv: ["float", "float"],
  retval: "float"
};
var pplus = {
  name: "pplus",
  argv: ["vec2", "vec2"],
  retval: "vec2"
};
var pt = {
  name: "pt",
  argv: [],
  retval: "vec2"
};
var t = {
  name: "t",
  argv: [],
  retval: "float"
};

var leafNodePT = [pt, 0];
var leafNodeT = [t, 0];

const operatorList =
[saturate, [palette_pf, [palette_pp, [scalar, [pmult, [protfold, [
  dist,
  [rotate, [fold, [pplus, [fplus, [ftimes, [fmix, [
    pmix,
    [fatan, [fmax, [cmix, [fless, [negative, [discretize, [
      inrange,
      [pfoci, [pclosestmax, [fclosest, [torus, [bor, [band, [
        fif,
        [cif, [pif, [rgbv, [hsl, [bw, 0]]]]]
      ]]]]]]]
    ]]]]]]]
  ]]]]]]]
]]]]]]];


////////////////////////////////////////////// unused

var palette_f = {
  name: "palette_f",
  argv: ["float"],
  retval: "vec3",
  choices: "[function]"
};
var palette_p = {
  name: "palette_p",
  argv: ["vec2"],
  retval: "vec3",
  choices: "[function]"
};
var fsin = {
  name: "fsin",
  argv: ["float"],
  retval: "float",
  choices: "[function]"
};
var sqrt = {
  name: "sqrt",
  argv: ["float"],
  retval: "float",
  choices: "[function]"
};
var fabs = {
  name: "fabs",
  argv: ["float"],
  retval: "float",
  choices: "[function]"
};
var even = {
  name: "even",
  argv: ["float", "float"],
  retval: "bool",
  choices: "[function]"
};
var close = {
  name: "close",
  argv: ["vec2", "vec2"],
  retval: "bool",
  choices: "[function]"
};