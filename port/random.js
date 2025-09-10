export {
   bits,
   int,
   float,
   full_init,
   init
}

const defaultSeed =
      [ 509760043,
         399328820,
         99941072,
         112282318,
         611886020,
         516451399,
         626288598,
         337482183,
         748548471,
         808894867,
         657927153,
         386437385,
         42355480,
         977713532,
         311548488,
         13857891,
         307938721,
         93724463,
         1041159001,
         444711218,
         1040610926,
         233671814,
         664494626,
         1071756703,
         188709089,
         420289414,
         969883075,
         513442196,
         275039308,
         918830973,
         598627151,
         134083417,
         823987070,
         619204222,
         81893604,
         871834315,
         398384680,
         475117924,
         520153386,
         324637501,
         38588599,
         435158812,
         168033706,
         585877294,
         328347186,
         293179100,
         671391820,
         846150845,
         283985689,
         502873302,
         718642511,
         938465128,
         962756406,
         107944131,
         192910970 ];

const defaultState = [ defaultSeed, 0 ];

// restituisce un array di lunghezza k.
// se k < s.length, allora taglia s
// altrimenti restituisce s+'aaaaa...'
function pad(k, s) {
   var n = s.length;
   if (n <= k)
      return s + 'a'.repeat(k - n);
   else
      return s.slice(n - k);
};

function state_full_init(s, seed) {
   function combine(accu, x) {
      return pad(16, accu + x.toString());
   };
   function extract(d) {
      return d.charCodeAt(0) + (d.charCodeAt(1) << 8)
            + (d.charCodeAt(2) << 16) ^ d.charCodeAt(3) << 22;
   }
   var l = seed.length;
   for (var i = 0; i <= 54; i++) s[0][i] = i;
   var accu = "x";
   for (var i = 0; i <= 54 + Math.max(55, l); i++) {
      var j = i % 55;
      var k = i % l;
      accu = combine(accu, seed[k]);
      s[0][j] = s[0][j] ^ extract(accu);
   }
   return s[1] = 0;
};

function state_bits(s) {
   s[1] = (s[1] + 1) % 55;
   var newval = s[0][(s[1] + 24) % 55] + s[0][s[1]] & 1073741823;
   s[0][s[1]] = newval;
   return newval;
};

function state_intaux(s, n) {
   var r = state_bits(s);
   var v = r % n;
   if (r - v > 1073741823 - n + 1)
      return state_intaux(s, n);
   return v;
};

function state_int(s, bound) {
   if (bound > 1073741823 || bound <= 0)
      throw new Error("random.state_int: invalid input " + bound);
   return state_intaux(s, bound);
};

function rawfloat(s) {
   var scale = 1073741824.0;
   var r0 = state_bits(s);
   var r1 = state_bits(s);
   var r2 = state_bits(s);
   return ((r0 / scale + r1) / scale + r2) / scale;
};

function state_float(s, bound) {
   return rawfloat(s) * bound;
};

//*    EXPORTS     *//

function bits(unit) { return state_bits(defaultState); };
function int(bound) { return state_int(defaultState, bound); };
function float(scale) { return state_float(defaultState, scale); };
function full_init(seed) { return state_full_init(defaultState, seed); };
function init(seed) { return state_full_init(defaultState, [seed]); };