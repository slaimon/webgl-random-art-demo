export {
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
    t
 }
 
 const palette_pf = 
 `vec3 palette_pf (vec2 v, float a, vec3 palette[3]) {
    vec3 u = vec3(abs(v), abs(a));
    u = u / dot(u, vec3(1.0));   
    return MIX3(u.x,
                u.y,
                palette[0],
                palette[1],
                palette[2]);
 }`
 
 const palette_pp =
 `vec3 palette_pp (vec2 v, vec2 w, vec3 palette[4]) {
    vec4 u = vec4(abs(v), abs(w));
    float t = 1.0 / dot(u, vec4(1.0));
    u = u * t;
    
    return MIX4(
       u.x,
       u.y,
       u.z,
       palette[0],
       palette[1],
       palette[2],
       palette[3]
    );
 }`
 
 const scalar =
 `float scalar (vec2 v, vec2 rnd, float phi) {
    float a = cos(phi);
    float b = sin(phi);
    vec2 u = (v - rnd) * vec2(a,b);
 
    return u.x + u.y;
 }`
 
 const pmult =
 `vec2 pmult (vec2 v, vec2 w, vec2 rnd) {
    vec2 u = v - rnd;
    vec2 r = w - rnd;
    
    vec2 p = vec2( u.x*r.x - u.y*r.y,
                   u.x*r.y + u.y*r.x ); 
    
    return rnd + p;
 }`
 
 const protfold =
 `vec2 protfold (vec2 p, vec2 q, float t) {
    vec2 d = p - q;
    float phi = RANGE(-t, t, -PI, PI, ATAN2(d.y, d.x));
    float r = length(d);
    
    return q + r * vec2(cos(phi), sin(phi));
 }`
 
 const fold =
 `vec2 fold(vec2 p, vec2 q, float z, vec2 rnd_point, vec2 weights, float phi) {
    vec2 xy = rnd_point + weights.x * p;
    vec2 ab = q - xy;
    float t = phi + 2.0*PI * weights.y * z;
    
    vec2 f = vec2(cos(t), sin(t));
    float r = 2.0 * max(0.0, dot(ab, f));
    
    return q - r * f;
 }`
 
 // float dist(vec2, vec2, vec2, float)
 const dist =
 `#define dist(v,w,rnd,weight) SQRT2*length(v-rnd-weight*w)-1.0`
 
 const rotate =
 `vec2 rotate( vec2 v, vec2 w, float k, vec2 weights, vec2 rnd_point, float phi) {
    vec2 p = rnd_point + weights.x * v;
    vec2 a = w - p;
    float t = phi + 2.0 * PI * weights.y * k;
    
    float cs = cos(t);
    float sn = sin(t);
    
    mat2 Rt = mat2( vec2(cs, -sn),
                    vec2(sn,  cs) );
    
    return p + Rt * a;
 }`
 
 const discretize =
 `vec2 discretize (vec2 v, vec2 w, vec2 rnd_point, float rnd_float) {
    vec2 r = rnd_float * w + rnd_point;
    return r * floor(v/r);
 }`
 
 // float ftimes(float, float, vec2)
 const ftimes =
 `#define ftimes(a,b,v) (a+v.x)*(b+v.y)`
 
 // float fatan(float, float, float)
 const fatan =
 `#define fatan(a,rnd,alpha)  2.0*atan((a-rnd)/alpha)/PI`
 
 // bool inrange(float, float, float)
 const inrange =
 `#define inrange(x,a,b) (a<x && x<b)`
 
 /*
    firma originale:
    vec2 pfoci(vec2, vec2, vec2, float, vec2[N], float[N])
    
    primo e ultimo parametro aggiuntivo, come per pclosestmax, sono:
    - nome del nodo corrente (es. e2)
    - lunghezza degli array ps e fs
 */
 const pfoci =
 `#define pfoci(e,p,q,r,w,ps,fs,N) { float v = 0.0; for(int i=0; i<N; i++) { v = length(p - ps[i] - w*r); if(v*v < fs[i]) { e = p - ps[i]; break; } e = q; } }`
 
 /*
    firma originale:
    vec2 pclosestmax(vec2, float, vec2[N])
    
    il primo e l'ultimo parametro aggiuntivo della macro (e,N) sono,
    rispettivamente, una stringa che contiene il nome del nodo corrente
    (es. e1) e la lunghezza dell'array ps
 */
 const pclosestmax =
 `#define PCLOSE(t,v,u) max(t*u.x-v.x, t*u.y-v.y)
 #define pclosestmax(e,v,t,ps,N) { vec2 u = ps[0]; float y = PCLOSE(t,v,u); float tmp; for(int i=1; i<N;i++) { tmp = PCLOSE(t,v,ps[i]); if(tmp<=y || y!=y) { y = tmp; u = ps[i]; } } e = u; }`
 
 const fclosest =
 `#define FCLOSE(a,b,u) abs(b*u - a)
 #define fclosest(e,a,b,sc,N) { float u = sc[0]; float y = FCLOSE(a,b,u); float tmp; for(int i=1; i<N; i++) { tmp = FCLOSE(a,b,sc[i]); if(tmp<=y || y!=y) { y = tmp; u = sc[i]; } } e = u; }`
 
 const torus =
 `vec2 torus(vec2 v, float r, float s) {
    float a = min(r, s) - 0.1;
    float b = max(r, s) + 0.1;
    
    float wx = RANGE(a, b, -1.0, 1.0, v.x);
    float wy = RANGE(a, b, -1.0, 1.0, v.y);
    
    return vec2(wx,wy);
 }`
 
 // bool bor(bool, bool)
 const bor =
 `#define bor(a,b) (a||b)`
 
 // bool band(bool, bool)
 const band =
 `#define band(a,b) (a&&b)`
 
 // float fif(bool, float, float)
 const fif =
 `#define fif(c,a,b) (c?a:b)`
 
 // vec2 pif(bool, vec2, vec2)
 const pif =
 `#define pif(c,a,b) (c?a:b)`
 
 // vec3 cif(bool, vec3, vec3)
 const cif =
 `#define cif(c,a,b) (c?a:b)`
 
 // vec3 bw(float)
 const bw =
 `#define bw(a) vec3(a)`
 
 // vec3 rgb(float, float, float)
 const rgb =
 `#define rgb(r,g,b) vec3(r,g,b)`
 
 // vec3 rgbv(vec2, vec2)
 const rgbv =
 `#define rgbv(a,b) b.y*vec3(a, b.x)`
 
 const hsl =
 `vec3 rgb_of_hsl(vec3 hsl) {
    float v = (hsl.z <= 0.5) ? (hsl.z * (1.0 + hsl.y)) : (hsl.z + hsl.y - hsl.z * hsl.y);
    if (v <= 0.0) return vec3(0.0);
    float m = hsl.z + hsl.z - v;
    float sv = (v - m) / v;
    float h6 = abs(hsl.x * 6.0);
    int sextant = int(mod(floor(h6), 6.0));  // riga sostanzialmente modificata
    float frac = h6 - floor(h6);
    float vsf = v * sv * frac;
    float mid1 = m + vsf;
    float mid2 = v - vsf;
    if (sextant < 0 || sextant > 4) return vec3(v, m, mid2);
    if(sextant == 0) return vec3(v, mid1, m);
    if(sextant == 1) return vec3(mid2, v, m);
    if(sextant == 2) return vec3(m, v, mid1);
    if(sextant == 3) return vec3(m, mid2, v);
    if(sextant == 4) return vec3(mid1, m, v);
    else return vec3(0.0);
 }
 vec3 hsl(vec2 a, float b) {
    vec3 hsl = vec3( RANGE(-1.0, 1.0, 0.0, 1.0, a.x / 2.0),
                     RANGE(-1.0, 1.0, 0.0, 1.0, b),
                     RANGE(-1.0, 1.0, 0.0, 1.0, a.y));
    
    vec3 rgb = rgb_of_hsl(hsl);
    
    return 2.0 * rgb - 1.0; 
 }`
 
 const saturate =
 `vec3 saturate (vec3 color, float a) {
    
    float t = max(1.0, RANGE(-1.0, +1.0, 0.0, 1.1, a));
    float max_component = max(color.r, max(color.g, color.b)) + 0.01;
    float min_component = min(color.r, min(color.g, color.b)) - 0.01;
    
    vec3 color2 = 2.0 * (color - min_component) / (max_component - min_component) - 1.0;
    
    return mix(color2, color, t);
 }`
 
 // bool negative(float)
 const negative =
 `#define negative(a) (a<0.0)`
 
 // bool fless(float, float)
 const fless =
 `#define fless(a,b) (a<b)`
 
 // float fmax(float, float)
 const fmax =
 `#define fmax(a,b) max(a,b)`
 
 // float fmix(float, float, float)
 const fmix =
 `#define fmix(a,b,c) mix(c,b,abs(RGBRANGE(0.0,1.0,a)))`
 
 // vec2 pmix(vec2, vec2, float)
 const pmix =
 `#define pmix(a,b,c) mix(b,a,abs(RANGE(-1.0,1.0,-1.0,1.0,c)))`
 
 // vec3 cmix(vec3, vec3, float)
 const cmix =
 `#define cmix(a,c1,c2) mix(c2,c1,a)`
 
 // float fplus(float, float)
 const fplus =
 `#define fplus(a,b) 0.5*(a+b)`
 
 // vec2 pplus(vec2, vec2)
 const pplus =
 `#define pplus(u,v) 0.5*(u+v)`
 
 const pt =
 `#define LEAF_NODE_PT pt`
 
 const t =
 `#define LEAF_NODE_T 0.0`