
export {
    hd,
    tl,
    nth,
    len,
    mem,
    map,
    rev,
    assq,
    fold_left,
    fold_right,
    append,
    combine,
    find_all,
    for_all,
    exists,
    to_array
}

// funzioni dal modulo List di ocamljs

function hd(lst) { return lst[0]; }
function tl(lst) { return lst[1]; }

// nel dizionario (lista ocaml di coppie) lst trova il primo valore associato alla chiave x
// si differenzia da assoc per l'uso del === al posto di caml_compare
function assq(x, lst) {
if (lst) {
{
 var match = lst[0];
 if (match[0] === x) return match[1];
 return assq(x, lst[1]);
}
}
throw new Error(`assq: key ${x} not found`);
}

// equivale a l[n] per le liste di ocaml che sono in realtà delle liste annidate: [a, [b, [c, ... ]]]
// per ora mi serve perché questo stupido modulo è tutto basato sulle liste stile ocaml
function nth(l, n) {
if (n < 0) throw new Error("List.nth: negative index");
function nth_aux(l, n) {
 if (!l) throw new Error("List.nth: undefined list");
 if (n === 0) return l[0];
 return nth_aux(l[1], n - 1);
};
return nth_aux(l, n);
};

// len(l) equivale ovviamente a l.length ma l è una lista stile ocaml
function len(l) {
if(l === 0) return 0;
if(l.length === 0 || l.length === 1) return 0;
return 1 + len(l[1]);
}

// funzione del modulo List anche questa
// List.member x lst è true sse x è membro di lst
function mem(x, lst) {
if (lst) return lst[0] == x || mem(x, lst[1]); // TODO usava caml_compare originariamente
return false;
}

// come map, ma per le liste stile ocaml
function map(f, lst) {
if (lst) {
var y = f(lst[0]);
return [y, map(f, lst[1])];
}
return 0;
};

// sta qui solo per la funzione palette_force in util.js
function fold_left(f, accu, l) {
if (l) return fold_left(f, f(accu, l[0]), l[1]);
return accu;
}

// lei invece sta qui per random_gene
function fold_right(f, l, accu) {
if (l) return f(l[0], fold_right(f, l[1], accu));
return accu;
}

// append l2 to the end of l1
function append(l1, l2) {
if(l1) return [l1[0], append(l1[1], l2)];
return l2;
}

// funziona come zip di python:
// combine([a1...an],[b1...bn]) === [[a1,b1]...[an,bn]]
function combine(l1, l2) {
var $r21 = false;
r$21: {
{
 if (!l1) { { if (l2) { { $r21 = true; break r$21; } } return 0; } }
 if (!l2) { { $r21 = true; break r$21; } }
 return [[l1[0], l2[0]], combine(l1[1], l2[1])];
}
}
if ($r21) throw new Error("List.combine: invalid_arg");
}

// reverse append: append l2 to the end of l1 after reversing the order of l1
function rev_append(l1, l2) { if (l1) return rev_append(l1[1], [l1[0], l2]); return l2; }
// returns l in reverse order
function rev(l) { return rev_append(l, 0); }

// originariamente: find_all(p)
// ma solo perché l'originale implementava l'applicazione parziale di funzioni;
// nel mio codice questo causava un bug
function find_all(p, l) {
function find(accu, lst) {
if (lst) {
 {
   var xs = lst[1];
   var x = lst[0];
   if (p(x)) return find([x, accu], xs);
   return find(accu, xs);
 }
}
return rev(accu);
}

return find(0, l);
}


function to_array(lst) {
function toarray_aux(acc, l) {
 if(!l) return acc;
 acc.push(l[0]);
 return toarray_aux(acc, l[1]);
}

return toarray_aux([], lst);
}

// i quantificatori qui sotto vengono usati solo in
// gene.connectible

function for_all(p, lst) {
if (lst) return p(lst[0]) && for_all(p, lst[1]);
return true;
}

function exists(p, lst) {
if (lst) return p(lst[0]) || exists(p, lst[1]);
return false;
}