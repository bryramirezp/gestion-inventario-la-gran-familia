import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@/presentation/components/icons/Icons';
import { Button } from '@/presentation/components/ui/Button';

interface DatePickerProps {
  selectedDate: string | null; // Expects YYYY-MM-DD
  onSelectDate: (date: string) => void;
  minDate?: string; // YYYY-MM-DD format
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatDisplayDate = (dateString: string | null): string => {
  if (!dateString) return '';
  // Use UTC to avoid timezone issues when parsing
  const date = new Date(`${dateString}T00:00:00Z`);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onSelectDate, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element
  const portalRef = useRef<HTMLDivElement>(null); // Ref for the portal content
  const [viewDate, setViewDate] = useState(
    selectedDate ? new Date(`${selectedDate}T00:00:00Z`) : new Date()
  );
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is on input or portal
      const isClickOnInput = inputRef.current?.contains(target);
      const isClickOnPortal = portalRef.current?.contains(target);

      // Only close if click is truly outside
      if (!isClickOnInput && !isClickOnPortal) {
        setIsOpen(false);
      }
    };

    // Use requestAnimationFrame to ensure the portal is mounted in the DOM
    // before registering the click listener
    let timer: NodeJS.Timeout | null = null;
    const frameId = requestAnimationFrame(() => {
      // Use a small additional delay to ensure React has finished rendering
      timer = setTimeout(() => {
        // Use mousedown instead of click to catch the event earlier
        // and avoid conflicts with the input's click handler
        document.addEventListener('mousedown', handleClickOutside, true);
      }, 0);
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (timer) {
        clearTimeout(timer);
      }
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      // Close if scrolling outside the datepicker, but not if scrolling within the datepicker itself
      if (isOpen && portalRef.current && !portalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Attach scroll listener to the window
    window.addEventListener('scroll', handleScroll, true); // Use capture phase
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, portalRef]); // Added portalRef to dependencies

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (amount: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDate(newDate);
    
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      newDate.setHours(0, 0, 0, 0);
      
      if (newDate < min) {
        return;
      }
    }
    
    onSelectDate(dateStr);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const blanks = Array.from({ length: startDay }, (_, i) => <div key={`blank-${i}`} />);
    const days = Array.from({ length: numDays }, (_, i) => {
      const day = i + 1;
      const dateStr = formatDate(new Date(year, month, day));
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === formatDate(new Date());
      
      let isDisabled = false;
      if (minDate) {
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0);
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        isDisabled = dayDate < min;
      }

      return (
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm transition-colors
            ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted dark:hover:bg-dark-muted'}
            ${!isSelected && isToday ? 'border border-primary' : ''}
            ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {day}
        </button>
      );
    });

    return [...blanks, ...days];
  };

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  // inputRef is already declared above, removed duplicate

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const calculatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const calendarWidth = 280;
      const calendarHeight = 320;
      
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;
      
      if (top + calendarHeight > viewportHeight + window.scrollY) {
        top = rect.top + window.scrollY - calendarHeight - 8;
      }
      
      if (left + calendarWidth > viewportWidth) {
        left = viewportWidth - calendarWidth - 16;
      }
      
      if (left < 16) {
        left = 16;
      }
      
      return {
        top: Math.max(8, top),
        left: Math.max(8, left),
        width: Math.max(rect.width, calendarWidth),
        position: 'fixed' as const,
      };
    }
    return { position: 'fixed' as const };
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={formatDisplayDate(selectedDate)}
          onMouseDown={(e) => {
            // Prevent default to avoid losing focus
            e.preventDefault();
            // Stop propagation to prevent the mousedown from reaching document listeners
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          onClick={(e) => {
            // Stop propagation to prevent the click from reaching document listeners
            e.stopPropagation();
          }}
          onFocus={(e) => {
            e.stopPropagation();
          }}
          placeholder="Selecciona una fecha"
          className="flex h-10 w-full cursor-pointer rounded-md border border-input dark:border-dark-input bg-background dark:bg-dark-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
      </div>

      {isOpen && portalTarget && createPortal(
        <div
          ref={portalRef} // Attach ref to the portal content
          className="fixed z-[150] bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg shadow-xl p-4 animate-slide-up"
          style={calculatePosition()}
          onMouseDown={(e) => {
            // Prevent clicks inside the calendar from closing it
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}>
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <div className="font-semibold text-center">
              {viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}>
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>,
        portalTarget
      )}
    </div>
  );
};
