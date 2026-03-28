export function nanoToAmount(nano: string | number, decimals: number = 9): number {
  const n = typeof nano === "string" ? BigInt(nano) : BigInt(Math.floor(nano));
  const divisor = BigInt(10 ** decimals);
  const whole = n / divisor;
  const remainder = n % divisor;
  const remainderStr = remainder.toString().padStart(decimals, "0");
  return parseFloat(`${whole}.${remainderStr}`);
}

export function amountToNano(amount: number | string, decimals: number = 9): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const multiplied = num * 10 ** decimals;
  return Math.floor(multiplied).toString();
}
