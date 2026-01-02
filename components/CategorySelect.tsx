import React, { useState, useRef, useEffect } from 'react';
import IconRenderer from './IconRenderer';
import { ChevronDown, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  type: string;
}

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Select Category',
  required = false,
  className = ''
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(cat => cat.id.toString() === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`input w-full flex items-center justify-between ${
          !value ? 'text-dark-500' : 'text-white'
        }`}
      >
        {selectedCategory ? (
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: selectedCategory.color + '20' || '#6366f120' }}
            >
              <IconRenderer
                iconName={selectedCategory.icon}
                className="w-4 h-4"
                fallbackEmoji="📊"
              />
            </div>
            <span>{selectedCategory.name}</span>
          </div>
        ) : (
          <span>{placeholder}</span>
        )}
        <div className="flex items-center space-x-1">
          {value && !required && (
            <X
              className="w-4 h-4 text-dark-400 hover:text-white"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-dark-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-dark-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="input w-full text-sm"
              autoFocus
            />
          </div>

          {/* Categories list */}
          <div className="overflow-y-auto max-h-48">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-dark-400 text-sm">
                No categories found
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id.toString())}
                  className={`w-full flex items-center space-x-3 p-3 hover:bg-dark-700 transition-colors ${
                    cat.id.toString() === value ? 'bg-dark-700' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cat.color + '20' || '#6366f120' }}
                  >
                    <IconRenderer
                      iconName={cat.icon}
                      className="w-5 h-5"
                      fallbackEmoji="📊"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white text-sm font-medium">{cat.name}</div>
                    {cat.type && (
                      <div className="text-dark-400 text-xs capitalize">{cat.type}</div>
                    )}
                  </div>
                  {cat.id.toString() === value && (
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
