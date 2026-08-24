import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface ThemedDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string; // YYYY-MM-DD (e.g. restrict to future dates)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const ThemedDatePicker: React.FC<ThemedDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select Date',
  minDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date values
  const initialDate = value ? new Date(value) : new Date('2026-08-24');
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update calendar state when value changes from props
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonthOffset = (year: number, month: number) => {
    // getDay() returns 0 for Sunday, 1 for Monday...
    // We want 0 for Monday, 6 for Sunday
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonthOffset(currentYear, currentMonth);

  const daysArray: (number | null)[] = [];
  // Add empty spaces for padding offset
  for (let i = 0; i < firstDayOffset; i++) {
    daysArray.push(null);
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;

    // Verify minDate restriction if present
    if (minDate && dateString < minDate) {
      return;
    }

    onChange(dateString);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date('2026-08-24T00:00:00'); // Consistent baseline
    const formattedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const formattedDay = today.getDate().toString().padStart(2, '0');
    const dateString = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;

    if (minDate && dateString < minDate) return;
    
    onChange(dateString);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const formatDateDisplay = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Date Input Box */}
      <div 
        style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          className="form-input"
          style={{ paddingRight: '40px', cursor: 'pointer', caretColor: 'transparent' }}
          placeholder={placeholder}
          value={formatDateDisplay(value)}
          readOnly
        />
        <CalendarIcon 
          size={16} 
          style={{ position: 'absolute', right: '16px', color: 'var(--text-dim)' }} 
        />
      </div>

      {/* Floating Glass Calendar Dropdown */}
      {isOpen && (
        <div 
          className="glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1000,
            width: '230px',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 8px 24px rgba(46, 46, 46, 0.10)',
            border: '1px solid var(--accent)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {/* Header (Month & Year navigation) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '13.5px', color: 'var(--text)' }}>
              {MONTHS[currentMonth]}, {currentYear}
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <button 
                type="button" 
                className="btn btn-small" 
                style={{ padding: '2px 4px', minWidth: 'auto', background: 'transparent', borderColor: 'transparent' }}
                onClick={handlePrevMonth}
              >
                <ChevronLeft size={13} color="var(--text)" />
              </button>
              <button 
                type="button" 
                className="btn btn-small" 
                style={{ padding: '2px 4px', minWidth: 'auto', background: 'transparent', borderColor: 'transparent' }}
                onClick={handleNextMonth}
              >
                <ChevronRight size={13} color="var(--text)" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
            {DAYS_OF_WEEK.map((d) => (
              <span 
                key={d} 
                className="mono-text" 
                style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center' }}>
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              // Build checking string
              const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
              const formattedDay = day.toString().padStart(2, '0');
              const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const isSelected = value === dateString;
              const isPastMin = minDate && dateString < minDate;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  disabled={!!isPastMin}
                  style={{
                    border: 'none',
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? 'white' : (isPastMin ? 'rgba(0,0,0,0.15)' : 'var(--text)'),
                    cursor: isPastMin ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: isSelected ? '700' : '500',
                    height: '24px',
                    width: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 1px 4px rgba(125,64,71,0.2)' : 'none'
                  }}
                  className={!isSelected && !isPastMin ? 'btn-day-hover' : ''}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* CSS Rule injection for day hover effect */}
          <style>{`
            .btn-day-hover:hover {
              background-color: rgba(125, 64, 71, 0.1) !important;
              color: var(--accent) !important;
              transform: scale(1.1);
            }
          `}</style>

          {/* Footer controls (Today, Clear, Close) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '6px', marginTop: '2px' }}>
            <button 
              type="button" 
              className="btn btn-small" 
              style={{ fontSize: '10px', border: 'none', padding: '2px 4px', color: 'var(--accent)' }}
              onClick={handleClear}
            >
              Clear
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                type="button" 
                className="btn btn-small"
                style={{ fontSize: '10px', border: 'none', padding: '2px 4px', color: 'var(--text)' }}
                onClick={handleToday}
              >
                Today
              </button>
              <button 
                type="button" 
                className="btn btn-small btn-solid" 
                style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px' }}
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
