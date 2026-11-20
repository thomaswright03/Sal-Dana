"use client";

import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

// Slow, warped folds of light, like brushed brass seen through smoke.
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * 0.35;

  vec2 q = vec2(fbm(p * 1.1 + vec2(0.0, t) + m), fbm(p * 1.1 + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p * 1.4 + 3.2 * q + vec2(1.7, 9.2) + t * 0.7),
                fbm(p * 1.4 + 3.2 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p * 1.2 + 3.4 * r - m);

  // Fine contour lines that follow the folds, like the edge of a machined surface.
  float bands = abs(fract(f * 7.0 + r.x * 2.0 - t * 0.6) - 0.5) * 2.0;
  float ridge = pow(1.0 - bands, 14.0);

  vec3 ink   = vec3(0.043, 0.039, 0.035);
  vec3 umber = vec3(0.150, 0.110, 0.070);
  vec3 brass = vec3(0.784, 0.643, 0.416);
  vec3 pale  = vec3(0.930, 0.830, 0.640);

  float body = smoothstep(0.25, 0.95, f);
  vec3 col = mix(ink, umber, body);
  col += brass * 0.30 * pow(body, 2.2);
  col += mix(brass, pale, r.y) * ridge * (0.16 + 0.60 * body);

  // Light pools toward the upper right and falls away to the corners.
  float pool = smoothstep(1.25, 0.0, length(p - vec2(0.55, 0.25) - m));
  col *= 0.50 + 0.85 * pool;
  col = mix(col, ink, smoothstep(0.55, 0.0, uv.y) * 0.75);
  col *= 1.0 - 0.55 * dot(uv - 0.5, uv - 0.5);

  gl_FragColor = vec4(col, 1.0);
}`;

/** Full-bleed WebGL backdrop. Falls back to the CSS gradient behind it when WebGL is unavailable. */
export function ShaderCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let visible = true;
    let frame = 0;
    const start = performance.now();

    const resize = () => {
      // The image is soft by nature, so render below native resolution to stay light.
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
      const w = Math.max(1, Math.floor(canvas.clientWidth * scale));
      const h = Math.max(1, Math.floor(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000 + 20);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      if (visible) draw();
      frame = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    };
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw();
    });

    resize();
    io.observe(canvas);
    ro.observe(canvas);
    canvas.dataset.ready = "true";
    if (reduce) {
      draw();
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`h-full w-full opacity-0 transition-opacity duration-[1600ms] data-[ready=true]:opacity-100 ${className}`}
    />
  );
}
