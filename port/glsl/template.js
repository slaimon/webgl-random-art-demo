export default (about, listing, library, data, text) =>
`/*
${about}
*/

#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;

#define PI     3.14159265359
#define SQRT2  1.41421356237

#define ZOOM   2.0
#define CENTER vec2(0.5)

#define RANGE(a, b, m, M, x)     M-(M-m)*abs(mod(abs(x-a),2.0*(b-a))/(b-a)-1.0)
#define RGBRANGE(m, M, x)        m+(M-m)*(0.5+atan(2.0*x)/PI)
#define ATAN2(y, x)              (x == 0.0)?(sign(y)*PI/2.0):atan(y,x)
#define MIX3(u,v,c1,c2,c3)       (u*c1+v*c2+(1.0-u-v)*c3)
#define MIX4(u,v,w,c1,c2,c3,c4)  (u*c1+v*c2+w*c3+(1.0-u-v)*c4)
#define COLOR(c)                 (c==c)?(floor(RGBRANGE(0.0,255.0,c))/255.0):(vec3(0.0))

// CHOICES:
${data.declarations}

void initialise() {
${data.array_init}}

// LIBRARY:
${library}

void main() {
     initialise();
     vec2 pt = ZOOM * (gl_FragCoord.xy/u_resolution.xy - CENTER);
     pt *= (u_resolution.x >= u_resolution.y) ? 
          vec2(u_resolution.x/u_resolution.y, 1.0) :
          vec2(1.0, u_resolution.y/u_resolution.x);
     pt.y = -pt.y;
      
     // GENE ASSEMBLY
${text}
   
     gl_FragColor = vec4(COLOR(e0), 1.0);
}`