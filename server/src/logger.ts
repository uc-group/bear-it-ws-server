/* eslint-disable no-console */
const levels = ['debug', 'info', 'warn', 'error', 'off'] as string[];
let currentLevel = 0;

const now = () => new Date().toISOString().replace('T', ' ').replace('Z', '');

export const setLevel = (level: string) => {
  currentLevel = Math.max(0, Math.min(levels.length - 1, levels.indexOf(level)));
};

export default {
  debug(...args: any[]) {
    if (currentLevel === 0) {
      console.log(`[${now()}][debug]`, ...args);
    }
  },
  info(...args: any[]) {
    if (currentLevel <= 1) {
      console.log(`[${now()}][debug]`, ...args);
    }
  },
  warn(...args: any[]) {
    if (currentLevel <= 2) {
      console.warn(`[${now()}][debug]`, ...args);
    }
  },
  error(...args: any[]) {
    if (currentLevel <= 3) {
      console.error(`[${now()}][debug]`, ...args);
    }
  },
};
