const enabled = process.env.NEXT_PUBLIC_LOGS === 'true';

export const logger = {
  log: (...args: unknown[]) => { if (enabled) console.log(...args); },
  warn: (...args: unknown[]) => { if (enabled) console.warn(...args); },
  error: (...args: unknown[]) => console.error(...args),
};
