import React, { useState, useEffect, useRef } from 'react';

// --- AnimatedWrapper ---
interface AnimatedWrapperProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
  as?: React.ElementType;
}

export const AnimatedWrapper: React.FC<
  AnimatedWrapperProps & React.HTMLAttributes<HTMLElement>
> = ({ children, delay = 0, direction = 'up', className, as: Component = 'div', ...rest }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(ref.current!);
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const getDirectionClasses = () => {
    switch (direction) {
      case 'left':
        return 'translate-x-5';
      case 'right':
        return '-translate-x-5';
      default:
        return 'translate-y-5';
    }
  };

  const transitionClasses = `transition-all duration-700 ease-out ${
    isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${getDirectionClasses()}`
  }`;

  return (
    <Component ref={ref} className={`${transitionClasses} ${className}`} {...rest}>
      {children}
    </Component>
  );
};

// --- AnimatedCounter ---
interface AnimatedCounterProps {
  value: number;
  delay?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, delay = 0 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = 0;
      const end = value;
      if (start === end) return;

      const duration = 1500;
      const startTime = Date.now();

      const step = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        setCount(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// --- SplitText ---
interface SplitTextProps {
  text: string;
  className?: string;
  duration?: number;
  stagger?: number;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className,
  duration = 1,
  stagger = 0.05,
}) => {
  return (
    <span
      aria-label={text}
      className={`inline-block ${className}`}
      style={{ whiteSpace: 'pre-wrap' }}
    >
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="inline-block"
          style={{
            animation: `slide-up ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
            animationDelay: `${index * stagger}s`,
          }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
};
