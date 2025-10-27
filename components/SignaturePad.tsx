import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface SignaturePadProps {
  width?: number;
  height?: number;
  onEnd?: () => void;
  theme?: 'light' | 'dark';
}

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => string | null;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ width = 400, height = 200, onEnd, theme = 'light' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size accounting for device pixel ratio for crisp lines
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Set initial context properties
      const lightColor = 'hsl(215 25% 27%)';
      const darkColor = 'hsl(210 40% 98%)';
      ctx.strokeStyle = theme === 'dark' ? darkColor : lightColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const getCoords = (event: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (event instanceof MouseEvent) {
          return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        }
        return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
      };

      const startDrawing = (event: MouseEvent | TouchEvent) => {
        event.preventDefault();
        const { x, y } = getCoords(event);
        ctx.beginPath();
        ctx.moveTo(x, y);
        isDrawing.current = true;
        hasDrawn.current = true;
      };

      const draw = (event: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        event.preventDefault();
        const { x, y } = getCoords(event);
        ctx.lineTo(x, y);
        ctx.stroke();
      };

      const stopDrawing = () => {
        if (!isDrawing.current) return;
        ctx.closePath();
        isDrawing.current = false;
        if (onEnd) onEnd();
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);

      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);

        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [width, height, onEnd, theme]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasDrawn.current = false;
          }
        }
      },
      getSignature: () => {
        const canvas = canvasRef.current;
        if (canvas && hasDrawn.current) {
          return canvas.toDataURL('image/png');
        }
        return null;
      },
      isEmpty: () => !hasDrawn.current,
    }));

    return (
      <canvas ref={canvasRef} className="border border-input rounded-md bg-background touch-none" />
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
