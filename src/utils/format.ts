/**
 * Format a BigInt value to a human-readable string with specified decimal places
 * @param value - The BigInt value to format
 * @param decimals - Number of decimals (default: 18 for WLD)
 * @param displayDecimals - Number of decimal places to show (default: 4)
 * @returns Formatted string
 */
export function formatBigInt(
  value: bigint, 
  decimals: number = 18, 
  displayDecimals: number = 4
): string {
  if (value === BigInt(0)) return '0';
  
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  
  if (remainder === BigInt(0)) {
    return quotient.toString();
  }
  
  // Convert remainder to decimal part
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const decimalPart = remainderStr.slice(0, displayDecimals).replace(/0+$/, '');
  
  if (decimalPart === '') {
    return quotient.toString();
  }
  
  return `${quotient}.${decimalPart}`;
}

/**
 * Parse a string value to BigInt with specified decimals
 * @param value - String value to parse (e.g., "1.5")
 * @param decimals - Number of decimals (default: 18 for WLD)
 * @returns BigInt representation
 */
export function parseUnits(value: string, decimals: number = 18): bigint {
  try {
    const num = parseFloat(value);
    if (isNaN(num)) return BigInt(0);
    return BigInt(Math.floor(num * (10 ** decimals)));
  } catch {
    return BigInt(0);
  }
}

/**
 * Format units from BigInt to string
 * @param value - BigInt value
 * @param decimals - Number of decimals (default: 18)
 * @returns Formatted string
 */
export function formatUnits(value: bigint, decimals: number = 18): string {
  return formatBigInt(value, decimals);
}

/**
 * Truncate a long address or hash for display
 * @param address - The address to truncate
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated string
 */
export function truncateAddress(
  address: string, 
  startChars: number = 6, 
  endChars: number = 4
): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format timestamp to readable date string
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Calculate percentage change between two values
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change as number
 */
export function calculatePercentageChange(
  oldValue: bigint, 
  newValue: bigint
): number {
  if (oldValue === BigInt(0)) return 0;
  const change = newValue - oldValue;
  return Number(change * BigInt(100) / oldValue);
}

/**
 * Format percentage with sign and color indication
 * @param percentage - Percentage as number
 * @returns Object with formatted string and color class
 */
export function formatPercentage(percentage: number): {
  text: string;
  colorClass: string;
} {
  const sign = percentage >= 0 ? '+' : '';
  const text = `${sign}${percentage.toFixed(2)}%`;
  const colorClass = percentage >= 0 ? 'text-green-400' : 'text-red-400';
  
  return { text, colorClass };
}

/**
 * Validate if a string is a valid positive number
 * @param value - String to validate
 * @returns Boolean indicating if valid
 */
export function isValidPositiveNumber(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Format currency with symbol
 * @param amount - Amount to format
 * @param symbol - Currency symbol (default: 'WLD')
 * @param decimals - Number of decimals to show (default: 4)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: bigint | string | number, 
  symbol: string = 'WLD', 
  decimals: number = 4
): string {
  let formattedAmount: string;
  
  if (typeof amount === 'bigint') {
    formattedAmount = formatBigInt(amount, 18, decimals);
  } else if (typeof amount === 'string') {
    const num = parseFloat(amount);
    formattedAmount = isNaN(num) ? '0' : num.toFixed(decimals);
  } else {
    formattedAmount = amount.toFixed(decimals);
  }
  
  return `${formattedAmount} ${symbol}`;
} 