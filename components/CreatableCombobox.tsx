import React, { useState, useRef, useEffect } from 'react';
import { Input } from './forms';
import { PlusIcon } from './icons/Icons';

interface ComboboxOption {
  value: string | number;
  label: string;
  details?: string;
}

interface CreatableComboboxProps {
  options: ComboboxOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  onCreate: (inputValue: string) => void;
  placeholder?: string;
}

const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  options,
  value,
  onChange,
  onCreate,
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

  useEffect(() => {
    if (selectedOption) {
      setQuery('');
    }
  }, [selectedOption]);

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

  const exactMatch = options.some((option) => option.label.toLowerCase() === query.toLowerCase());
  const showCreateOption = query.length > 0 && !exactMatch;

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setQuery('');
    setIsOpen(false);
  };

  const handleCreate = () => {
    onCreate(query);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        placeholder={selectedOption ? selectedOption.label : placeholder}
        value={query}
        onFocus={() => {
          setIsOpen(true);
          if (selectedOption) {
            setQuery(selectedOption.label);
            onChange(null); // Clear selection when user starts typing
          }
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
          if (value !== null) onChange(null);
        }}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 &&
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSelect(option.value)}
              >
                <p className="font-medium">{option.label}</p>
                {option.details && (
                  <p className="text-sm text-muted-foreground">{option.details}</p>
                )}
              </div>
            ))}
          {showCreateOption && (
            <div
              className="cursor-pointer hover:bg-muted p-2 flex items-center"
              onClick={handleCreate}
            >
              <PlusIcon className="w-4 h-4 mr-2 text-primary" />
              <p>
                Crear "<span className="font-semibold">{query}</span>"
              </p>
            </div>
          )}
          {filteredOptions.length === 0 && !showCreateOption && (
            <div className="p-2 text-sm text-muted-foreground">No se encontraron opciones.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatableCombobox;
