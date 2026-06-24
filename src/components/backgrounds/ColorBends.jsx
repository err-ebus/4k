import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec3 } from "ogl";

// Lightweight ogl flowing-gradient background (React Bits "Color Bends"
// equivalent). Slow, dreamy color bands for the lyrics screen.
// Pauses its rAF loop when the tab is hidden (perf rule 6).
export default function ColorBends({ speed = 0.15 }) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: false });
    const gl = renderer.gl;
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
        varying vec2 vUv;

        // cheap 2-octave value noise for soft bends
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          vec2 uv = vUv;
          float t = uTime;

          float n = noise(uv * 3.0 + vec2(t * 0.2, t * 0.15));
          n += 0.5 * noise(uv * 6.0 - vec2(t * 0.1, t * 0.25));

          float band = uv.y + 0.18 * sin(uv.x * 3.0 + t) + n * 0.25;

          vec3 c1 = vec3(0.10, 0.04, 0.22); // deep purple
          vec3 c2 = vec3(0.45, 0.10, 0.45); // magenta
          vec3 c3 = vec3(0.95, 0.45, 0.55); // warm pink
          vec3 c4 = vec3(0.25, 0.35, 0.75); // blue

          vec3 col = mix(c1, c2, smoothstep(0.0, 0.5, band));
          col = mix(col, c3, smoothstep(0.45, 0.9, band));
          col = mix(col, c4, 0.3 * sin(t * 0.3 + uv.x * 2.0) + 0.3);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec3() },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(container.clientWidth, container.clientHeight);
      program.uniforms.uResolution.value.set(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }
    window.addEventListener("resize", resize);
    resize();

    let paused = document.hidden;
    const onVis = () => {
      paused = document.hidden;
      if (!paused) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    let raf;
    const start = performance.now();
    function loop(now) {
      if (paused) return;
      program.uniforms.uTime.value = ((now - start) / 1000) * speed * 6.0;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, [speed]);

  return <div className="bg-layer" ref={ref} style={{ width: "100%", height: "100%" }} />;
}
