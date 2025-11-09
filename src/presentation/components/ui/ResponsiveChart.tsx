import React, { useRef, useEffect, useState } from 'react';
import { ResponsiveContainer } from 'recharts';
import { useBreakpoint } from '@/infrastructure/hooks/useBreakpoint';

interface ResponsiveChartProps {
  children: React.ReactNode;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  className?: string;
  useContainerQueries?: boolean;
}

/**
 * ResponsiveChart component that adapts chart dimensions based on viewport or container size.
 * 
 * By default, uses viewport-based breakpoints. Set `useContainerQueries={true}` to use
 * container queries instead, which adapt based on the container's size rather than viewport.
 * 
 * Container queries are useful when charts are inside constrained containers (e.g., cards, modals).
 */
export const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  children,
  minHeight = 200,
  maxHeight = 400,
  aspectRatio,
  className = '',
  useContainerQueries = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(maxHeight);
  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (useContainerQueries) {
      // Container queries will handle the sizing via CSS
      // We just need to set a reasonable default height
      setHeight(maxHeight);
      return;
    }

    // Viewport-based sizing (original implementation)
    const updateHeight = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        let newHeight: number;

        if (aspectRatio) {
          newHeight = containerWidth / aspectRatio;
        } else {
          switch (breakpoint) {
            case 'xs':
              newHeight = Math.min(containerWidth * 0.75, maxHeight);
              break;
            case 'sm':
              newHeight = Math.min(containerWidth * 0.7, maxHeight);
              break;
            case 'md':
              newHeight = Math.min(containerWidth * 0.6, maxHeight);
              break;
            case 'lg':
            case 'xl':
            case '2xl':
            default:
              newHeight = maxHeight;
              break;
          }
        }

        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
        setHeight(newHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [breakpoint, minHeight, maxHeight, aspectRatio, useContainerQueries]);

  // Container queries approach: uses CSS container queries for sizing
  if (useContainerQueries) {
    const containerQueryHeight = aspectRatio
      ? `min(100cqw / ${aspectRatio}, ${maxHeight}px)`
      : `clamp(${minHeight}px, 75cqw, ${maxHeight}px)`;

    return (
      <div
        ref={containerRef}
        className={`@container w-full ${className}`}
      >
        <div
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            height: containerQueryHeight,
            width: '100%',
          }}
          className="w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Viewport-based approach (default): uses JavaScript breakpoints
  return (
    <div ref={containerRef} className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
};

