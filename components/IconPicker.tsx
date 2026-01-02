import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import IconRenderer from './IconRenderer';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

// Common emoji options
const commonEmojis = [
  '📊', '💰', '🏠', '🚗', '🍔', '🎬', '🛒', '💡', 
  '📱', '👕', '✈️', '🏥', '📚', '🎮', '☕', '🍕',
  '💳', '🏦', '🎯', '💼', '🎓', '🏃', '🎨', '🎵',
  '🛍️', '🚇', '⚡', '🏡', '🔧', '💊', '🍜', '🎂'
];

// Common Lucide icon names for finance app
const commonLucideIcons = [
  'Briefcase', 'Code', 'Gift', 'TrendingUp', 'TrendingDown',
  'ShoppingCart', 'Car', 'Zap', 'Home', 'Shield',
  'Heart', 'Film', 'UtensilsCrossed', 'ShoppingBag', 'Repeat',
  'Plane', 'AlertCircle', 'PiggyBank', 'DollarSign', 'BookOpen',
  'Wifi', 'Scissors', 'Wrench', 'Palette', 'Dumbbell',
  'Dog', 'FileText', 'CreditCard', 'Baby', 'Shirt',
  'Sparkles', 'Smartphone', 'PartyPopper', 'Users', 'Building2',
  'Wallet', 'Target', 'Calendar', 'Plus', 'Minus',
  'ArrowUpRight', 'ArrowDownRight', 'CircleDollarSign', 'Coins', 'Banknote'
];

export default function IconPicker({ value, onChange, className = '' }: IconPickerProps) {
  const [tab, setTab] = useState<'emoji' | 'lucide'>('lucide');
  const [customInput, setCustomInput] = useState(value);

  const handleIconClick = (icon: string) => {
    onChange(icon);
    setCustomInput(icon);
  };

  return (
    <div className={className}>
      {/* Tabs */}
      <div className="flex space-x-2 mb-3 border-b border-dark-700">
        <button
          type="button"
          onClick={() => setTab('lucide')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'lucide'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-dark-400 hover:text-dark-300'
          }`}
        >
          Lucide Icons
        </button>
        <button
          type="button"
          onClick={() => setTab('emoji')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'emoji'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-dark-400 hover:text-dark-300'
          }`}
        >
          Emojis
        </button>
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-8 gap-2 mb-3 max-h-48 overflow-y-auto">
        {tab === 'emoji' ? (
          // Emoji picker
          commonEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleIconClick(emoji)}
              className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-all ${
                value === emoji
                  ? 'bg-primary-600 scale-110 shadow-lg'
                  : 'bg-dark-800 hover:bg-dark-700'
              }`}
            >
              {emoji}
            </button>
          ))
        ) : (
          // Lucide icon picker
          commonLucideIcons.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => handleIconClick(iconName)}
              title={iconName}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                value === iconName
                  ? 'bg-primary-600 scale-110 shadow-lg'
                  : 'bg-dark-800 hover:bg-dark-700'
              }`}
            >
              <IconRenderer iconName={iconName} className="w-5 h-5 text-white" />
            </button>
          ))
        )}
      </div>

      {/* Custom input */}
      <div>
        <label className="block text-xs text-dark-400 mb-1">
          {tab === 'emoji' ? 'Or type custom emoji:' : 'Or type Lucide icon name:'}
        </label>
        <input
          type="text"
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value);
            onChange(e.target.value);
          }}
          className="input w-full text-sm"
          placeholder={tab === 'emoji' ? 'e.g., 🎉' : 'e.g., Briefcase'}
        />
      </div>
    </div>
  );
}
