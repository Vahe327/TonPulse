import { useRef, useEffect } from "react";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AmountInput({
  value,
  onChange,
  placeholder = "0",
  disabled = false,
  autoFocus = false,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      onChange(raw);
    }
  };

  const fontSize =
    value.length > 12
      ? "var(--font-size-xl)"
      : value.length > 8
        ? "var(--font-size-xxl)"
        : "var(--font-size-display)";

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        fontFamily: "var(--font-mono)",
        fontSize,
        fontWeight: 600,
        color: value
          ? "var(--color-text-primary)"
          : "var(--color-text-tertiary)",
        background: "transparent",
        textAlign: "right",
        padding: 0,
        transition: `font-size var(--duration-fast) ease`,
        opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}
