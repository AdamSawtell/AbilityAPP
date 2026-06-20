"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

function canvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function SignatureCapturePad({
  disabled,
  onChange,
}: {
  disabled?: boolean;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const hasStrokeRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  const syncEmpty = useCallback(() => {
    onChange("");
    hasStrokeRef.current = false;
    setHasStroke(false);
  }, [onChange]);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    syncEmpty();
  }, [syncEmpty]);

  function startDraw(point: Point) {
    if (disabled) return;
    drawingRef.current = true;
    lastPointRef.current = point;
  }

  function drawTo(point: Point) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const last = lastPointRef.current;
    if (!canvas || !ctx || !drawingRef.current || !last) return;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    hasStrokeRef.current = true;
    setHasStroke(true);
  }

  function endDraw() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (hasStrokeRef.current) exportImage();
  }

  function clearPad() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    syncEmpty();
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={640}
        height={180}
        className={`w-full touch-none rounded-lg border border-slate-300 bg-white ${disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          startDraw(canvasPoint(e.currentTarget, e.clientX, e.clientY));
        }}
        onPointerMove={(e) => drawTo(canvasPoint(e.currentTarget, e.clientX, e.clientY))}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={clearPad}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Clear signature
        </button>
        {!hasStroke ? <span className="text-xs text-slate-500">Sign with mouse, stylus, or finger.</span> : null}
      </div>
    </div>
  );
}
