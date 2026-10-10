'use client';

import { useEffect, useRef } from 'react';

/**
 * Lugemi Anamorphic Visual & Motion Canvas
 *
 * Renders real 3D procedural anamorphic visuals in Lugemi teal & navy brand colors:
 * - Depth-projected multi-layer geometric canopy & sound-wave ribbons
 * - Pointer-reactive parallax tilt with smooth damping
 * - Subtle ambient idle motion (undulating harmonic sine waves)
 * - True anamorphic perspective projection (near field scales, far field retreats)
 * - Zero competitor references, pure Lugemi navy (#071018, #0b1a36, #10264d) & teal (#00b8ae, #7ff5ef, #007c78)
 */
export function AnamorphicCanopyCanvas({
  className = '',
  intensity = 1.0,
  showRings = true,
}: {
  className?: string;
  intensity?: number;
  showRings?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (width < 2 || height < 2) return;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointer.current.targetX = Math.max(-1, Math.min(1, px));
      pointer.current.targetY = Math.max(-1, Math.min(1, py));
    };

    const onPointerLeave = () => {
      pointer.current.targetX = 0;
      pointer.current.targetY = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    const render = () => {
      if (width < 2 || height < 2) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Smooth damp pointer toward target
      const ease = prefersReducedMotion.current ? 1 : 0.08;
      pointer.current.x += (pointer.current.targetX - pointer.current.x) * ease;
      pointer.current.y += (pointer.current.targetY - pointer.current.y) * ease;

      const px = pointer.current.x;
      const py = pointer.current.y;

      if (!prefersReducedMotion.current) {
        timeRef.current += 0.016;
      }
      const t = timeRef.current;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric background glow in Lugemi Navy/Teal
      const bgGrad = ctx.createRadialGradient(
        width * (0.65 + px * 0.08),
        height * (0.35 + py * 0.08),
        width * 0.05,
        width * 0.5,
        height * 0.55,
        Math.max(width, height) * 0.75,
      );
      bgGrad.addColorStop(0, 'rgba(0, 184, 174, 0.28)');
      bgGrad.addColorStop(0.35, 'rgba(0, 124, 120, 0.16)');
      bgGrad.addColorStop(0.7, 'rgba(16, 38, 77, 0.35)');
      bgGrad.addColorStop(1, 'rgba(7, 16, 24, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 3D Anamorphic projection setup
      const fov = 380;
      const cameraZ = 450;
      const centerX = width * 0.58 + px * 35;
      const centerY = height * 0.48 + py * 28;

      const project = (x3: number, y3: number, z3: number) => {
        // Rotations based on pointer & idle time
        const rotY = px * 0.42 + Math.sin(t * 0.35) * 0.06;
        const rotX = -py * 0.35 + Math.cos(t * 0.28) * 0.04;

        // Rotate Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const xY = x3 * cosY + z3 * sinY;
        const zY = -x3 * sinY + z3 * cosY;

        // Rotate X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const yX = y3 * cosX - zY * sinX;
        const zFinal = y3 * sinX + zY * cosX + cameraZ;

        const scale = fov / Math.max(10, zFinal);
        return {
          x: centerX + xY * scale,
          y: centerY + yX * scale,
          scale,
          depth: zFinal,
        };
      };

      // 1. Anamorphic 3D Lattice Ribbons (Sound wave / language roots mesh)
      const ribbons = 7;
      const segments = 28;
      const ribbonWidth = width * 0.52 * intensity;
      const ribbonHeight = height * 0.38 * intensity;

      for (let r = 0; r < ribbons; r++) {
        const rFrac = (r / (ribbons - 1) - 0.5) * 2;
        const zOffset = rFrac * 120;
        const wavePhase = r * 0.65 + t * 0.9;

        ctx.beginPath();
        let first = true;

        for (let s = 0; s <= segments; s++) {
          const u = s / segments - 0.5;
          const x3 = u * ribbonWidth;
          const undulating =
            Math.sin(u * Math.PI * 3 + wavePhase) * 26 +
            Math.cos(u * Math.PI * 1.5 - t * 0.7) * 14;
          const y3 = rFrac * (ribbonHeight * 0.32) + undulating;
          const p = project(x3, y3, zOffset);

          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }

        const alpha = (0.18 + (1 - Math.abs(rFrac)) * 0.38) * intensity;
        ctx.strokeStyle = r % 2 === 0 ? `rgba(0, 184, 174, ${alpha})` : `rgba(127, 245, 239, ${alpha * 0.85})`;
        ctx.lineWidth = Math.max(1, (1.8 - Math.abs(rFrac) * 0.6) * dpr * 0.7);
        ctx.stroke();
      }

      // 2. Anamorphic Resonant Canopy Rings (Acoustic wave nodes)
      if (showRings) {
        const ringCount = 5;
        for (let i = 0; i < ringCount; i++) {
          const ringRad = 45 + i * 36;
          const ringZ = -60 + i * 40;
          const points = 36;
          ctx.beginPath();
          for (let pIdx = 0; pIdx <= points; pIdx++) {
            const angle = (pIdx / points) * Math.PI * 2;
            const waveMod = Math.sin(angle * 4 + t * 1.2 + i) * 6;
            const rx = Math.cos(angle) * (ringRad + waveMod);
            const ry = Math.sin(angle) * (ringRad * 0.45 + waveMod * 0.45);
            const pr = project(rx, ry, ringZ);
            if (pIdx === 0) ctx.moveTo(pr.x, pr.y);
            else ctx.lineTo(pr.x, pr.y);
          }
          const ringAlpha = (0.22 - i * 0.035) * intensity;
          ctx.strokeStyle = `rgba(0, 184, 174, ${Math.max(0.04, ringAlpha)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // 3. Floating 3D Spark/Resonance nodes (Speaking agents / accents in depth)
      const nodeCount = 14;
      for (let n = 0; n < nodeCount; n++) {
        const phi = (n / nodeCount) * Math.PI * 2 + t * 0.2;
        const dist = 120 + Math.sin(n * 2.3 + t * 0.5) * 45;
        const nx3 = Math.cos(phi) * dist;
        const ny3 = Math.sin(phi * 1.5 + n) * 45;
        const nz3 = Math.sin(phi) * dist * 0.8;
        const projNode = project(nx3, ny3, nz3);

        const nodeGrad = ctx.createRadialGradient(
          projNode.x,
          projNode.y,
          0,
          projNode.x,
          projNode.y,
          projNode.scale * 12,
        );
        nodeGrad.addColorStop(0, 'rgba(127, 245, 239, 0.85)');
        nodeGrad.addColorStop(0.4, 'rgba(0, 184, 174, 0.45)');
        nodeGrad.addColorStop(1, 'rgba(16, 38, 77, 0)');

        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(projNode.x, projNode.y, Math.max(2, projNode.scale * 8), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [intensity, showRings]);

  return (
    <canvas
      ref={canvasRef}
      className={`anamorphic-canopy-canvas ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
