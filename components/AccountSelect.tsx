import React, { useState, useRef, useEffect } from 'react';
import IconRenderer from './IconRenderer';
import { ChevronDown, X } from 'lucide-react';

interface Account {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  type?: string;
  balance?: number;
}

interface AccountSelectProps {
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  formatBalance?: (balance: number) => string;
}

export default function AccountSelect({
  accounts,
  value,
  onChange,
  placeholder = 'Select Account',
  required = false,
  className = '',
  formatBalance
}: AccountSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAccount = accounts.find(acc => acc.id.toString() === value);

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

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (accountId: string) => {
    onChange(accountId);
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
        {selectedAccount ? (
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: selectedAccount.color + '20' || '#6366f120' }}
            >
              <IconRenderer
                iconName={selectedAccount.icon}
                className="w-4 h-4"
                fallbackEmoji="💳"
              />
            </div>
            <span className="truncate">{selectedAccount.name}</span>
            {selectedAccount.balance !== undefined && formatBalance && (
              <span className="text-dark-400 text-sm ml-auto flex-shrink-0">
                {formatBalance(selectedAccount.balance)}
              </span>
            )}
          </div>
        ) : (
          <span>{placeholder}</span>
        )}
        <div className="flex items-center space-x-1 ml-2">
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
              placeholder="Search accounts..."
              className="input w-full text-sm"
              autoFocus
            />
          </div>

          {/* Accounts list */}
          <div className="overflow-y-auto max-h-48">
            {filteredAccounts.length === 0 ? (
              <div className="p-4 text-center text-dark-400 text-sm">
                No accounts found
              </div>
            ) : (
              filteredAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelect(acc.id.toString())}
                  className={`w-full flex items-center space-x-3 p-3 hover:bg-dark-700 transition-colors ${
                    acc.id.toString() === value ? 'bg-dark-700' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: acc.color + '20' || '#6366f120' }}
                  >
                    <IconRenderer
                      iconName={acc.icon}
                      className="w-5 h-5"
                      fallbackEmoji="💳"
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white text-sm font-medium truncate">{acc.name}</div>
                    <div className="flex items-center space-x-2">
                      {acc.type && (
                        <span className="text-dark-400 text-xs capitalize">{acc.type}</span>
                      )}
                      {acc.balance !== undefined && formatBalance && (
                        <>
                          <span className="text-dark-600">•</span>
                          <span className="text-dark-400 text-xs">{formatBalance(acc.balance)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {acc.id.toString() === value && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></div>
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
