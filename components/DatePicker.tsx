import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './icons/Icons';
import { Button } from './Button';

interface DatePickerProps {
  selectedDate: string | null; // Expects YYYY-MM-DD
  onSelectDate: (date: string) => void;
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

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onSelectDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element
  const portalRef = useRef<HTMLDivElement>(null); // Ref for the portal content
  const [viewDate, setViewDate] = useState(
    selectedDate ? new Date(`${selectedDate}T00:00:00Z`) : new Date()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        portalRef.current &&
        !portalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputRef, portalRef]); // Added inputRef and portalRef to dependencies

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
    onSelectDate(formatDate(newDate));
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

      return (
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm transition-colors
            ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted dark:hover:bg-dark-muted'}
            ${!isSelected && isToday ? 'border border-primary' : ''}
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
      return {
        top: rect.bottom + window.scrollY + 8, // 8px for mt-2
        left: rect.left + window.scrollX,
        width: rect.width,
      };
    }
    return {};
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={formatDisplayDate(selectedDate)}
          onClick={() => setIsOpen(!isOpen)}
          onFocus={() => setIsOpen(true)}
          placeholder="Selecciona una fecha"
          className="flex h-10 w-full cursor-pointer rounded-md border border-input dark:border-dark-input bg-background dark:bg-dark-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {isOpen && portalTarget && createPortal(
        <div
          ref={portalRef} // Attach ref to the portal content
          className="absolute z-[150] bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg shadow-lg p-4 animate-slide-up"
          style={calculatePosition()}
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
