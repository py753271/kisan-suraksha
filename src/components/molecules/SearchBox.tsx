'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface LocationResult {
  id: string;
  type: 'district' | 'village' | 'tehsil';
  name: string;
  displayName: string;
  stateName: string;
  stateCode: string;
  districtName?: string;
  districtId?: string;
  villageId?: string;
  latitude: number | null;
  longitude: number | null;
  lat?: number | null;
  lng?: number | null;
}

interface SearchBoxProps {
  onSelect: (location: LocationResult) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onSelect }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced live API search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setShow(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(() => {
      api
        .get('/map/locations/search', { params: { q: trimmed, limit: 10 } })
        .then((res) => {
          const fetchedResults = res.data?.data || [];
          setResults(fetchedResults);
          setShow(true);
          setSelectedIndex(-1);
        })
        .catch(() => {
          setResults([]);
          setShow(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LocationResult) => {
    setQuery(item.displayName || item.name);
    setShow(false);
    onSelect(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShow(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-4 w-5 h-5 text-ks-text-secondary pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShow(true);
          }}
          placeholder={t('selectVillage')}
          aria-expanded={show}
          aria-autocomplete="list"
          role="combobox"
          className="w-full pl-12 pr-10 py-3 bg-ks-surface text-ks-text border border-ks-border rounded-xl shadow-ks-sm focus:outline-none focus:ring-2 focus:ring-primary-green touch-target"
        />
        {loading && (
          <Loader2 className="absolute right-4 w-4 h-4 text-primary-green animate-spin pointer-events-none" />
        )}
      </div>

      {show && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-ks-surface border border-ks-border rounded-xl shadow-ks-lg max-h-64 overflow-y-auto z-50 divide-y divide-ks-border"
        >
          {results.length > 0 ? (
            results.map((item, index) => (
              <li key={item.id || `${item.type}-${index}`} role="option" aria-selected={selectedIndex === index}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-3 hover:bg-ks-border/20 flex items-center gap-3 text-ks-text font-medium touch-target transition ${
                    selectedIndex === index ? 'bg-ks-border/30' : ''
                  }`}
                >
                  <MapPin className="w-5 h-5 text-primary-green shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-bold text-ks-text">{item.name}</span>
                    <span className="truncate text-xs text-ks-text-secondary">
                      {item.type === 'district' ? 'District' : 'Village'}
                      {item.districtName && item.type === 'village' ? ` • ${item.districtName}` : ''}
                      {item.stateName ? ` • ${item.stateName}` : ''}
                    </span>
                  </div>
                </button>
              </li>
            ))
          ) : (
            !loading && (
              <li className="px-4 py-3 text-xs text-ks-text-secondary font-medium text-center">
                No matching village or district found.
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
