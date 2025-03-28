import { useState } from 'react';
import { 
  FaMapMarkerAlt, FaCalendarAlt, FaStar, 
  FaFilter, FaChevronDown, FaChevronUp 
} from 'react-icons/fa';
import { 
  SearchFilters, 
  AGE_GROUPS, 
  DAYS_OF_WEEK, 
  LANGUAGES, 
  RATING_OPTIONS,
  SORT_OPTIONS
} from '../types';

import {
  inputWithIconClass,
  selectWithIconClass,
  checkboxClass
} from '@/components/ui/InputStyles';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

// Custom input class with explicit white background and black text
const inputClass = inputWithIconClass;
const selectClass = selectWithIconClass;

export default function SearchFiltersComponent({ 
  filters, 
  onFilterChange, 
  onSearch 
}: SearchFiltersProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleBooleanFilter = (key: keyof SearchFilters) => {
    onFilterChange({ 
      ...filters, 
      [key]: filters[key] === true ? undefined : true 
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter('location', e.target.value);
  };

  const handleDayOfWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
    updateFilter('dayOfWeek', value);
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
    updateFilter('minRating', value);
  };

  const handleAgeGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter('ageGroup', e.target.value || undefined);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter('language', e.target.value || undefined);
  };

  const handleMinRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
    updateFilter('minRate', value);
  };

  const handleMaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
    updateFilter('maxRate', value);
  };

  const handleMinExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
    updateFilter('minExperience', value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = SORT_OPTIONS.find(option => 
      `${option.value}-${option.order || 'desc'}` === e.target.value
    );
    
    if (selectedOption) {
      updateFilter('sortBy', selectedOption.value);
      updateFilter('sortOrder', selectedOption.order || 'desc');
    }
  };

  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSearch(); }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Location filter */}
          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="location"
                value={filters.location || ''}
                onChange={handleLocationChange}
                className={inputClass}
                placeholder="Enter your postcode"
              />
            </div>
          </div>

          {/* Day of Week filter */}
          <div>
            <label htmlFor="dayOfWeek" className="mb-1 block text-sm font-medium text-gray-700">
              Day Available
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaCalendarAlt className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="dayOfWeek"
                value={filters.dayOfWeek?.toString() || ''}
                onChange={handleDayOfWeekChange}
                className={selectClass}
              >
                <option value="">Any day</option>
                {DAYS_OF_WEEK.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating filter */}
          <div>
            <label htmlFor="rating" className="mb-1 block text-sm font-medium text-gray-700">
              Minimum Rating
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaStar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="rating"
                value={filters.minRating?.toString() || ''}
                onChange={handleRatingChange}
                className={selectClass}
              >
                {RATING_OPTIONS.map(option => (
                  <option key={option.value} value={option.value.toString()}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* More filters section */}
        {showMoreFilters && (
          <div className="space-y-4 rounded-md bg-gray-50 p-4 mt-4">
            <h3 className="font-medium text-gray-900">Additional Filters</h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Age Group filter */}
              <div>
                <label htmlFor="ageGroup" className="mb-1 block text-sm font-medium text-gray-700">
                  Age Group
                </label>
                <select
                  id="ageGroup"
                  value={filters.ageGroup || ''}
                  onChange={handleAgeGroupChange}
                  className={selectClass.replace("pl-10", "pl-3")}
                >
                  <option value="">Any age group</option>
                  {AGE_GROUPS.map(group => (
                    <option key={group} value={group}>
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language filter */}
              <div>
                <label htmlFor="language" className="mb-1 block text-sm font-medium text-gray-700">
                  Language Spoken
                </label>
                <select
                  id="language"
                  value={filters.language || ''}
                  onChange={handleLanguageChange}
                  className={selectClass.replace("pl-10", "pl-3")}
                >
                  <option value="">Any language</option>
                  {LANGUAGES.map(language => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort options */}
              <div>
                <label htmlFor="sort" className="mb-1 block text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <select
                  id="sort"
                  value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                  onChange={handleSortChange}
                  className={selectClass.replace("pl-10", "pl-3")}
                >
                  {SORT_OPTIONS.map(option => (
                    <option 
                      key={`${option.value}-${option.order || 'desc'}`} 
                      value={`${option.value}-${option.order || 'desc'}`}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Price Range filters */}
              <div>
                <label htmlFor="minRate" className="mb-1 block text-sm font-medium text-gray-700">
                  Min Price (€/hr)
                </label>
                <input
                  type="number"
                  id="minRate"
                  min="0"
                  step="0.5"
                  value={filters.minRate?.toString() || ''}
                  onChange={handleMinRateChange}
                  className={inputClass.replace("pl-10", "pl-3")}
                  placeholder="Min €"
                />
              </div>

              <div>
                <label htmlFor="maxRate" className="mb-1 block text-sm font-medium text-gray-700">
                  Max Price (€/hr)
                </label>
                <input
                  type="number"
                  id="maxRate"
                  min="0"
                  step="0.5"
                  value={filters.maxRate?.toString() || ''}
                  onChange={handleMaxRateChange}
                  className={inputClass.replace("pl-10", "pl-3")}
                  placeholder="Max €"
                />
              </div>

              <div>
                <label htmlFor="minExperience" className="mb-1 block text-sm font-medium text-gray-700">
                  Min Experience (years)
                </label>
                <input
                  type="number"
                  id="minExperience"
                  min="0"
                  step="1"
                  value={filters.minExperience?.toString() || ''}
                  onChange={handleMinExperienceChange}
                  className={inputClass.replace("pl-10", "pl-3")}
                  placeholder="Min years"
                />
              </div>
            </div>

            {/* Certification filters */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium text-gray-700">Certifications & Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.firstAidCert === true}
                    onChange={() => toggleBooleanFilter('firstAidCert')}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-gray-700">First Aid Certified</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.childrenFirstCert === true}
                    onChange={() => toggleBooleanFilter('childrenFirstCert')}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-gray-700">Children First Certified</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.gardaVetted === true}
                    onChange={() => toggleBooleanFilter('gardaVetted')}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-gray-700">Garda Vetted</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.tuslaRegistered === true}
                    onChange={() => toggleBooleanFilter('tuslaRegistered')}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-gray-700">Tusla Registered</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.specialNeedsExp === true}
                    onChange={() => toggleBooleanFilter('specialNeedsExp')}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-gray-700">Special Needs Experience</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.mealsProvided === true}
                    onChange={() => toggleBooleanFilter('mealsProvided')}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-gray-700">Meals Provided</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.pickupDropoff === true}
                    onChange={() => toggleBooleanFilter('pickupDropoff')}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-gray-700">Pickup/Dropoff</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-1 text-sm font-medium text-violet-600"
          >
            <FaFilter className="h-4 w-4" /> 
            {showMoreFilters ? 'Less filters' : 'More filters'}
            {showMoreFilters ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
          </button>
          <button
            type="submit"
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
} 