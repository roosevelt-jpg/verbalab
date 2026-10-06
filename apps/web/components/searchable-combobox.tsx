'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

export type ComboboxOption = {
  value: string;
  label: string;
  /** Optional secondary search tokens (codes, aliases). */
  keywords?: string;
  group?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  /** Shown when the closed control has no matching label for value. */
  emptyLabel?: string;
  'aria-label'?: string;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function matches(option: ComboboxOption, needle: string) {
  if (!needle) return true;
  const hay = `${option.label} ${option.value} ${option.keywords ?? ''}`.toLowerCase();
  return hay.includes(needle);
}

/**
 * Type-to-filter combobox with keyboard navigation (↑↓ Enter Esc).
 * Mobile-friendly: full-width input, large tap targets in the listbox.
 */
export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  className,
  id,
  disabled,
  emptyLabel = 'Select…',
  'aria-label': ariaLabel,
}: Props) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return options.filter((o) => matches(o, needle));
  }, [options, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ComboboxOption[]>();
    for (const opt of filtered) {
      const key = opt.group ?? '';
      const list = groups.get(key) ?? [];
      list.push(opt);
      groups.set(key, list);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = filtered;

  useEffect(() => {
    if (!open) return;
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = useCallback(
    (next: string) => {
      onChange(next);
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    },
    [onChange],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.min(h + 1, Math.max(flatFiltered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const opt = flatFiltered[highlight];
      if (opt) pick(opt.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Tab') {
      setOpen(false);
      setQuery('');
    }
  };

  const displayValue = open ? query : selected?.label ?? (value ? value : '');

  let flatIndex = -1;

  return (
    <div ref={rootRef} className={className} style={rootStyle} data-combobox>
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={selected ? selected.label : emptyLabel || placeholder}
        value={displayValue}
        style={inputStyle}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setQuery('');
        }}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && !disabled ? (
        <ul id={listboxId} role="listbox" style={listStyle}>
          {flatFiltered.length === 0 ? (
            <li style={emptyStyle} role="presentation">
              No matches
            </li>
          ) : (
            [...grouped.entries()].map(([group, opts]) => (
              <li key={group || 'ungrouped'} role="presentation" style={{ listStyle: 'none' }}>
                {group ? <div style={groupStyle}>{group}</div> : null}
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {opts.map((opt) => {
                    flatIndex += 1;
                    const idx = flatIndex;
                    const active = idx === highlight;
                    const isSelected = opt.value === value;
                    return (
                      <li
                        key={`${opt.group ?? ''}:${opt.value}`}
                        role="option"
                        aria-selected={isSelected}
                        style={{
                          ...optionStyle,
                          background: active ? 'var(--brand-soft, rgba(0,184,174,0.12))' : 'transparent',
                          fontWeight: isSelected ? 650 : 400,
                        }}
                        onMouseEnter={() => setHighlight(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pick(opt.value);
                        }}
                      >
                        {opt.label}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

const rootStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  minWidth: 0,
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.8rem 0.95rem',
  borderRadius: 'var(--radius-control, 8px)',
  border: '1px solid var(--border-subtle, var(--line, #cbd5e1))',
  background: 'var(--surface-canvas, var(--bg, #fff))',
  color: 'var(--text-primary, var(--ink, #172b4d))',
  outline: 'none',
  font: 'inherit',
  boxSizing: 'border-box',
};

const listStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 40,
  left: 0,
  right: 0,
  top: 'calc(100% + 4px)',
  maxHeight: 'min(16rem, 50vh)',
  overflowY: 'auto',
  margin: 0,
  padding: '0.25rem 0',
  listStyle: 'none',
  background: 'var(--surface-canvas, var(--bg, #fff))',
  border: '1px solid var(--border-subtle, var(--line, #cbd5e1))',
  borderRadius: 'var(--radius-control, 8px)',
  boxShadow: 'var(--shadow, 0 12px 40px rgba(16,38,77,0.12))',
  WebkitOverflowScrolling: 'touch',
};

const optionStyle: CSSProperties = {
  padding: '0.65rem 0.95rem',
  cursor: 'pointer',
  fontSize: '0.92rem',
  lineHeight: 1.35,
  color: 'var(--text-primary, var(--ink, #172b4d))',
};

const groupStyle: CSSProperties = {
  padding: '0.45rem 0.95rem 0.25rem',
  fontSize: '0.72rem',
  fontWeight: 650,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-secondary, var(--muted, #52647a))',
};

const emptyStyle: CSSProperties = {
  padding: '0.75rem 0.95rem',
  color: 'var(--text-secondary, var(--muted, #52647a))',
  fontSize: '0.9rem',
};
