'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Pointer = { x: number; y: number };

const ENGINES = [
  { id: 'mix', label: 'Mix', angle: 0 },
  { id: 'fidelity', label: 'Fidelity', angle: 45 },
  { id: 'live', label: 'Live', angle: 90 },
  { id: 'edge', label: 'Edge', angle: 135 },
  { id: 'grounded', label: 'Grounded', angle: 180 },
  { id: 'atlas', label: 'Atlas', angle: 225 },
  { id: 'baobab', label: 'Baobab', angle: 270 },
  { id: 'echo', label: 'Echo', angle: 315 },
] as const;

/**
 * Pointer-reactive anamorphic canopy — CSS 3D + canvas mesh in Lugemi navy/teal.
 * No external 3D assets; skew + depth read as a living language canopy.
 */
export function BaobabPlane({ className = '' }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef<Pointer>({ x: 0, y: 0 });
  const current = useRef<Pointer>({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const [tilt, setTilt] = useState({ rx: 8, ry: -14 });
  const [active, setActive] = useState<string>('baobab');
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const paintMesh = useCallback((nx: number, ny: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 2 || h < 2) return;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createRadialGradient(
      w * (0.35 + nx * 0.12),
      h * (0.28 + ny * 0.1),
      20,
      w * 0.5,
      h * 0.55,
      Math.max(w, h) * 0.72,
    );
    g.addColorStop(0, 'rgba(0, 184, 174, 0.55)');
    g.addColorStop(0.35, 'rgba(0, 124, 120, 0.28)');
    g.addColorStop(0.7, 'rgba(16, 38, 77, 0.55)');
    g.addColorStop(1, 'rgba(11, 26, 54, 0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const cols = 14;
    const rows = 10;
    const warpX = nx * 48;
    const warpY = ny * 36;
    ctx.strokeStyle = 'rgba(127, 245, 239, 0.22)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const u = c / cols;
        const v = r / rows;
        const depth = 1 + (v - 0.5) * 0.55;
        const x = w * 0.08 + u * w * 0.84 * depth + warpX * (v - 0.5) * 2;
        const y =
          h * 0.12 +
          v * h * 0.76 +
          Math.sin(u * Math.PI * 2 + nx) * 10 * depth +
          warpY * (u - 0.5);
        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const u = c / cols;
        const v = r / rows;
        const depth = 1 + (v - 0.5) * 0.55;
        const x = w * 0.08 + u * w * 0.84 * depth + warpX * (v - 0.5) * 2;
        const y =
          h * 0.12 +
          v * h * 0.76 +
          Math.sin(u * Math.PI * 2 + nx) * 10 * depth +
          warpY * (u - 0.5);
        if (r === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(w * (0.5 + nx * 0.04), h * (0.42 + ny * 0.03));
    for (let i = 0; i < 5; i++) {
      const rr = 40 + i * 38 + Math.abs(nx) * 8;
      ctx.beginPath();
      ctx.ellipse(0, i * 8, rr * 1.35, rr * 0.42, nx * 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 184, 174, ${0.35 - i * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Dynamic anamorphic canopy trunk & roots geometry
    ctx.beginPath();
    ctx.moveTo(-18, 20);
    ctx.quadraticCurveTo(0 + nx * 12, 90, 22, h * 0.38);
    ctx.lineTo(-22, h * 0.38);
    ctx.quadraticCurveTo(0 - nx * 8, 100, 14, 20);
    ctx.fillStyle = 'rgba(16, 38, 77, 0.55)';
    ctx.fill();

    // Harmonic pulse wave nodes on canopy branches
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2;
      const rad = 130 + Math.sin(ang * 3 + nx * 2) * 20;
      const bx = Math.cos(ang) * rad;
      const by = Math.sin(ang) * (rad * 0.4);
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = k % 2 === 0 ? 'rgba(0, 184, 174, 0.9)' : 'rgba(127, 245, 239, 0.9)';
      ctx.shadowColor = 'rgba(0, 184, 174, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();
  }, []);

  useEffect(() => {
    const tick = () => {
      const ease = reduceMotion.current ? 1 : 0.12;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;
      const { x, y } = current.current;
      setTilt({
        rx: 8 + y * 14,
        ry: -14 + x * 22,
      });
      paintMesh(x, y);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    const onResize = () => paintMesh(current.current.x, current.current.y);
    window.addEventListener('resize', onResize);
    paintMesh(0, 0);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', onResize);
    };
  }, [paintMesh]);

  const onPointer = (e: React.PointerEvent) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    target.current = { x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) };
  };

  const onLeave = () => {
    target.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={rootRef}
      className={`baobab-plane ${className}`.trim()}
      onPointerMove={onPointer}
      onPointerLeave={onLeave}
      role="img"
      aria-label="Interactive Lugemi Baobab canopy — anamorphic language intelligence plane"
    >
      <div
        className="baobab-plane__stage"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.06)`,
        }}
      >
        <canvas ref={canvasRef} className="baobab-plane__canvas" aria-hidden />
        <div className="baobab-plane__glass baobab-plane__glass--back" />
        <div className="baobab-plane__glass baobab-plane__glass--mid" />
        <div className="baobab-plane__glass baobab-plane__glass--front" />
        <div className="baobab-plane__beam" aria-hidden />
        <ul className="baobab-plane__orbit" aria-hidden>
          {ENGINES.map((eng) => {
            const rad = (eng.angle * Math.PI) / 180;
            const ox = Math.cos(rad) * 38;
            const oy = Math.sin(rad) * 22;
            const isOn = active === eng.id;
            return (
              <li
                key={eng.id}
                className={`baobab-plane__node${isOn ? ' is-active' : ''}`}
                style={{
                  transform: `translate3d(calc(-50% + ${ox}%), calc(-50% + ${oy}%), ${isOn ? 56 : 28}px)`,
                }}
                onPointerEnter={() => setActive(eng.id)}
              >
                {eng.label}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="baobab-plane__hint">Move across the canopy · eight engines in depth</p>
    </div>
  );
}
