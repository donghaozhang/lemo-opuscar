// Screen compositor (WebGL2): image = tonemap( Σ lamps × hide transmittance × cloth ) ; + front layer (over) ; + glow layer (additive)
// Lamps are per-lamp objects {x, y, I, hot, sigB, sigC, col:[r,g,b], box:[x0,y0,x1,y1]|null} in world units; the camera is [cx, cy, zoom].
// Learned from the library's shadow-puppet compositor (lamp lobe + hotspot, 1-exp tonemap, bloom pyramid, warm vignette); rewritten for
// several worlds (square, backstage, dawn), per-lamp colour and a boxed lamp (the show's lamp only lights its own cloth).
const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;
const NL = 14;
const SCREEN = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D tr, front, glow; uniform vec2 res; uniform vec3 cam; uniform vec4 rect;
uniform vec4 L1[${NL}]; uniform vec4 L2[${NL}]; uniform vec4 L3[${NL}]; uniform vec4 L4[${NL}];
uniform vec3 amb, fadeCol; uniform float expo, time, cloth, fade, edge, rectOn;
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.0; for (int i=0;i<4;i++){ s += a*vn(p); p *= 2.03; a *= .5; } return s; }
void main(){
  vec2 px = vec2(uv.x, 1.0-uv.y) * res;
  vec2 s = cam.xy + (px - res*.5) / cam.z;          // world coordinates
  vec4 F = texture(front, uv);
  vec3 T = texture(tr, uv).rgb;
  vec3 L = amb;
  for (int k=0;k<${NL};k++){ vec4 a = L1[k]; if (a.z <= 0.0) continue; vec4 b = L2[k]; vec3 c = L3[k].rgb; vec4 bx = L4[k];
    vec2 d = s - a.xy; float r2 = dot(d,d);
    float f = a.z * (exp(-r2/(2.0*b.x*b.x)) + a.w * exp(-r2/(2.0*b.y*b.y)));
    if (b.z > .5) { float m = smoothstep(bx.x-b.w, bx.x+b.w, s.x) * smoothstep(bx.z+b.w, bx.z-b.w, s.x) * smoothstep(bx.y-b.w, bx.y+b.w, s.y) * smoothstep(bx.w+b.w, bx.w-b.w, s.y); f *= m; }
    L += f * c; }
  // Cloth: fine weave anchored to the screen (never aliases), fibre speckle and density blotches anchored to the world
  float th = .5 + .5*sin(px.x*1.9 + vn(px*.35)*2.0) * sin(px.y*1.9 + vn(px.yx*.35)*2.0);
  float cl = 1.0 - cloth*(.05*th + .045*vn(px*1.3) + .09*(fbm(s*.0045) - .5) + .03*(h2(floor(px*1.1)) - .5));
  float ed = 1.0;
  if (rectOn > .5) { float ins = step(rect.x, s.x) * step(s.x, rect.z) * step(rect.y, s.y) * step(s.y, rect.w);
    float e = smoothstep(0.0, edge, s.x-rect.x) * smoothstep(0.0, edge, rect.z-s.x) * smoothstep(0.0, edge*.85, s.y-rect.y) * smoothstep(0.0, edge*.85, rect.w-s.y);
    ed = mix(1.0, .6 + .4*e, ins); }
  vec3 hdr = L * T * cl * ed * expo;
  vec3 c = 1.0 - exp(-hdr);
  c = F.rgb + c * (1.0 - F.a);
  c += texture(glow, uv).rgb;
  c = mix(c, fadeCol, fade);
  o = vec4(c, 1);
}`;
const DOWN = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform vec2 px; uniform float thr;
vec3 t(vec2 q){ vec3 c = texture(src,q).rgb; float l = dot(c, vec3(.3,.55,.15)); return c * smoothstep(thr, thr+.2, l); }
void main(){ o = vec4(t(uv)*.25 + (t(uv+px*vec2(1,1)) + t(uv+px*vec2(-1,1)) + t(uv+px*vec2(1,-1)) + t(uv+px*vec2(-1,-1)))*.1875, 1); }`;
const BLUR = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform vec2 dir;
void main(){ float w[5] = float[](.2270270270, .1945945946, .1216216216, .0540540541, .0162162162);
  vec3 c = texture(src,uv).rgb*w[0]; for(int i=1;i<5;i++){ c += (texture(src,uv+dir*float(i)*1.5).rgb + texture(src,uv-dir*float(i)*1.5).rgb)*w[i]; } o = vec4(c,1); }`;
const COMP = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D scene, b1, b2, b3; uniform float bloom, vign, sat, contrast; uniform vec3 bcol, tint, vcol;
void main(){
  vec3 c = texture(scene, uv).rgb;
  vec3 B = texture(b1,uv).rgb*.5 + texture(b2,uv).rgb*.7 + texture(b3,uv).rgb*.8;
  c += B * bloom * bcol;
  c = clamp(c, 0.0, 1.0);
  float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
  c = mix(c, c*c*(3.0-2.0*c), contrast);
  c *= tint;
  vec2 d = uv - .5; float vv = vign * smoothstep(.25, .95, dot(d*vec2(1.25, 1.0), d*vec2(1.25, 1.0))*2.2); c *= mix(vec3(1.0), vcol, vv);
  o = vec4(clamp(c, 0.0, 1.0), 1);
}`;
export function makeGL(cv) {
  const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const W = cv.width, H = cv.height;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  const P = { screen: prog(SCREEN), down: prog(DOWN), blur: prog(BLUR), comp: prog(COMP) };
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); return t; };
  const fbo = (w, h) => { const t = tex(w, h), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
  const T = { tr: tex(), front: tex(), glow: tex() };
  const A = fbo(W, H), D = [fbo(W / 2, H / 2), fbo(W / 4, H / 4), fbo(W / 8, H / 8)], Dt = [fbo(W / 2, H / 2), fbo(W / 4, H / 4), fbo(W / 8, H / 8)];
  const up = (t, c, premul) => { gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); };
  const U = (p, n) => gl.getUniformLocation(p, n);
  const bindT = (p, name, t, unit) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U(p, name), unit); };
  const draw = (f) => { gl.bindFramebuffer(gl.FRAMEBUFFER, f ? f.f : null); gl.viewport(0, 0, f ? f.w : W, f ? f.h : H); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  // o: {cam:[cx,cy,z], lamps:[{x,y,I,hot,sigB,sigC,col,box}], amb:[r,g,b], expo, rect:[x0,y0,x1,y1]|null, edge, cloth, fade, fadeCol, bloom, thr, vign, vcol, sat, contrast, bcol, tint}
  function render(tr, front, glow, o) {
    up(T.tr, tr, false); up(T.front, front, true); up(T.glow, glow, true);
    let p = P.screen; gl.useProgram(p);
    bindT(p, 'tr', T.tr, 0); bindT(p, 'front', T.front, 1); bindT(p, 'glow', T.glow, 2);
    gl.uniform2f(U(p, 'res'), W, H); gl.uniform3f(U(p, 'cam'), ...(o.cam || [960, 540, 1]));
    const r = o.rect || [0, 0, 0, 0]; gl.uniform4f(U(p, 'rect'), ...r); gl.uniform1f(U(p, 'rectOn'), o.rect ? 1 : 0); gl.uniform1f(U(p, 'edge'), o.edge ?? 60);
    const l1 = new Float32Array(NL * 4), l2 = new Float32Array(NL * 4), l3 = new Float32Array(NL * 4), l4 = new Float32Array(NL * 4);
    (o.lamps || []).slice(0, NL).forEach((l, i) => {
      l1.set([l.x, l.y, l.I, l.hot ?? 1], i * 4); l2.set([l.sigB ?? 650, l.sigC ?? 110, l.box ? 1 : 0, l.soft ?? 40], i * 4);
      l3.set([...(l.col || [1, .77, .46]), 0], i * 4); l4.set(l.box || [0, 0, 0, 0], i * 4);
    });
    gl.uniform4fv(U(p, 'L1'), l1); gl.uniform4fv(U(p, 'L2'), l2); gl.uniform4fv(U(p, 'L3'), l3); gl.uniform4fv(U(p, 'L4'), l4);
    const f1 = (n, v) => gl.uniform1f(U(p, n), v);
    f1('expo', o.expo ?? 1.6); f1('time', o.time ?? 0); f1('cloth', o.cloth ?? 1); f1('fade', o.fade ?? 0);
    gl.uniform3f(U(p, 'amb'), ...(o.amb || [0, 0, 0])); gl.uniform3f(U(p, 'fadeCol'), ...(o.fadeCol || [0, 0, 0]));
    draw(A);
    let src = A.t;
    for (let i = 0; i < 3; i++) {
      p = P.down; gl.useProgram(p); bindT(p, 'src', src, 0); gl.uniform2f(U(p, 'px'), 1 / D[i].w, 1 / D[i].h); gl.uniform1f(U(p, 'thr'), i === 0 ? (o.thr ?? .7) : 0); draw(D[i]);
      p = P.blur; gl.useProgram(p); bindT(p, 'src', D[i].t, 0); gl.uniform2f(U(p, 'dir'), 1 / D[i].w, 0); draw(Dt[i]);
      bindT(p, 'src', Dt[i].t, 0); gl.uniform2f(U(p, 'dir'), 0, 1 / D[i].h); draw(D[i]);
      src = D[i].t;
    }
    p = P.comp; gl.useProgram(p);
    bindT(p, 'scene', A.t, 0); bindT(p, 'b1', D[0].t, 1); bindT(p, 'b2', D[1].t, 2); bindT(p, 'b3', D[2].t, 3);
    const f2 = (n, v) => gl.uniform1f(U(p, n), v);
    f2('bloom', o.bloom ?? .32); f2('vign', o.vign ?? .4); f2('sat', o.sat ?? 1.08); f2('contrast', o.contrast ?? .12);
    gl.uniform3f(U(p, 'bcol'), ...(o.bcol || [1, .82, .6])); gl.uniform3f(U(p, 'tint'), ...(o.tint || [1, 1, 1])); gl.uniform3f(U(p, 'vcol'), ...(o.vcol || [.7, .47, .25]));
    draw(null);
  }
  return { render, gl };
}
