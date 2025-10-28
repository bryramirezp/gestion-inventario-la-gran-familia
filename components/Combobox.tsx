import React, { useState, useRef, useEffect } from 'react';
import { Input } from './forms';

interface ComboboxOption {
  value: string | number;
  label: string;
  details?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        placeholder={selectedOption ? selectedOption.label : placeholder}
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
          if (value !== null) onChange(null);
        }}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="cursor-pointer hover:bg-muted dark:hover:bg-dark-muted p-2"
                onClick={() => handleSelect(option.value)}
              >
                <p className="font-medium text-foreground dark:text-dark-foreground">{option.label}</p>
                {option.details && (
                  <p className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{option.details}</p>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground dark:text-dark-muted-foreground">No se encontraron opciones.</div>
          )}
        </div>
      )}
    </div>
  );
};
