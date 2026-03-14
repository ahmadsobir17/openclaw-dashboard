export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRateLimit<T>(
  fn: () => Promise<T>,
  minDelay: number = 8000,
  maxDelay: number = 12000
): Promise<T> {
  const delayMs = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  await delay(delayMs);
  return fn();
}

export function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}
