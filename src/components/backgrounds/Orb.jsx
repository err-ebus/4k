import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec3 } from "ogl";

// Lightweight ogl orb background (React Bits "Orb" equivalent).
// Props match the spec table: hue, hoverIntensity, rotateOnHover.
// Pauses its rAF loop when the tab is hidden (perf rule 6).
export default function Orb({
  hue = 280,
  hoverIntensity = 0.4,
  rotateOnHover = true,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: /* glsl */ `
        attribute vec2 uv;
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragment: /* glsl */ `
        precision highp float;
        uniform float uTime;
        uniform vec3 uResolution;
        uniform float uHue;
        uniform float uHover;
        uniform float uRot;
        varying vec2 vUv;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 res = uResolution.xy;
          vec2 uv = (gl_FragCoord.xy * 2.0 - res) / min(res.x, res.y);

          float a = uRot;
          uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;

          float d = length(uv);
          float t = uTime * 0.4;

          // soft pulsing orb
          float ring = sin(d * 6.0 - t * 2.0) * 0.5 + 0.5;
          float glow = smoothstep(1.0, 0.0, d);
          float core = smoothstep(0.6 + uHover * 0.2, 0.0, d);

          float baseHue = uHue / 360.0;
          vec3 col = hsv2rgb(vec3(baseHue + ring * 0.08 + d * 0.1, 0.7, 1.0));
          col *= glow * (0.5 + ring * 0.5);
          col += core * hsv2rgb(vec3(baseHue + 0.05, 0.4, 1.0)) * (0.6 + uHover);

          float alpha = clamp(glow * 1.1, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec3() },
        uHue: { value: hue },
        uHover: { value: 0 },
        uRot: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }
    window.addEventListener("resize", resize);
    resize();

    let targetHover = 0;
    const onMove = () => {
      targetHover = hoverIntensity;
    };
    const onLeave = () => {
      targetHover = 0;
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    let paused = document.hidden;
    const onVis = () => {
      paused = document.hidden;
      if (!paused) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    let raf;
    let rot = 0;
    const start = performance.now();
    function loop(now) {
      if (paused) return; // shader paused when tab hidden
      const time = (now - start) / 1000;
      program.uniforms.uTime.value = time;
      program.uniforms.uHover.value +=
        (targetHover - program.uniforms.uHover.value) * 0.06;
      if (rotateOnHover) rot += 0.0015 + program.uniforms.uHover.value * 0.01;
      program.uniforms.uRot.value = rot;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, [hue, hoverIntensity, rotateOnHover]);

  return <div className="bg-layer" ref={ref} style={{ width: "100%", height: "100%" }} />;
}
