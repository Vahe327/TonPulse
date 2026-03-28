const SUBSCRIPT_DIGITS = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

function toSubscript(n: number): string {
  return String(n).split("").map((d) => SUBSCRIPT_DIGITS[parseInt(d)] || d).join("");
}

export function formatPrice(price: number | string): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return "$0.00";
  if (num >= 1000) return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num >= 1) return `$${num.toFixed(4)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;

  const str = num.toFixed(20);
  const afterDot = str.split(".")[1] || "";
  let zeros = 0;
  for (const ch of afterDot) {
    if (ch === "0") zeros++;
    else break;
  }

  if (zeros >= 2) {
    const significant = afterDot.slice(zeros, zeros + 4);
    return `$0.0${toSubscript(zeros)}${significant}`;
  }
  return `$${num.toFixed(6)}`;
}

export function formatLargeNumber(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatPercent(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00%";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatTokenAmount(amount: string | number, decimals: number = 4): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(decimals);
}
