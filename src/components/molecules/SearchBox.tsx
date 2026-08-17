'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VillageSuggestion {
  id: string;
  districtId?: string;
  name: string;
}

interface SearchBoxProps {
  onSelect: (villageName: string) => void;
}

const defaultVillages: VillageSuggestion[] = [
  { id: '1', name: 'Rajkot, Gujarat' },
  { id: '2', name: 'Patna, Bihar' },
  { id: '3', name: 'Bathinda, Punjab' },
  { id: '4', name: 'Morbi, Gujarat' },
  { id: '5', name: 'Gondal, Gujarat' },
];

export const SearchBox: React.FC<SearchBoxProps> = ({ onSelect }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<VillageSuggestion[]>(defaultVillages);
  const [filtered, setFiltered] = useState<VillageSuggestion[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Attempt to query real backend villages list
    api.get('/map/boundaries/village')
      .then(res => {
        if (res.data?.data && res.data.data.length > 0) {
          setSuggestions(res.data.data.map((v: any) => ({ id: v.id, name: v.name })));
        }
      })
      .catch(() => {
        // Fall back gracefully to local default list on error
        setSuggestions(defaultVillages);
      });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length > 1) {
      const match = suggestions.filter(item =>
        item.name.toLowerCase().includes(val.toLowerCase())
      );
      setFiltered(match);
      setShow(true);
    } else {
      setFiltered([]);
      setShow(false);
    }
  };

  const handleSelect = (item: VillageSuggestion) => {
    setQuery(item.name);
    setShow(false);
    onSelect(item.name);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-4 w-5 h-5 text-ks-text-secondary pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder={t('selectVillage')}
          className="w-full pl-12 pr-4 py-3 bg-ks-surface text-ks-text border border-ks-border rounded-xl shadow-ks-sm focus:outline-none focus:ring-2 focus:ring-primary-green touch-target"
        />
      </div>

      {show && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 mt-2 bg-ks-surface border border-ks-border rounded-xl shadow-ks-lg max-h-60 overflow-y-auto z-50 divide-y divide-ks-border">
          {filtered.map(item => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-ks-border/20 flex items-center gap-3 text-ks-text font-medium touch-target"
              >
                <MapPin className="w-4 h-4 text-primary-green" />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
