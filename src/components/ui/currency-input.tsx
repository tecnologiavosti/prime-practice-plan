import * as React from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number | string;
  onChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [display, setDisplay] = React.useState<string>(String(value || ""));

    React.useEffect(() => {
      setDisplay(value === 0 || value === "" ? "0" : String(value));
    }, [value]);

    return (
      <Input
        ref={ref}
        type="number"
        step="0.01"
        {...props}
        value={display}
        onFocus={(e) => {
          if (parseFloat(display) === 0) {
            setDisplay("");
          } else {
            e.target.select();
          }
        }}
        onBlur={() => {
          const num = parseFloat(display);
          if (isNaN(num) || display === "") {
            setDisplay("0");
            onChange(0);
          }
        }}
        onChange={(e) => {
          setDisplay(e.target.value);
          onChange(parseFloat(e.target.value) || 0);
        }}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
