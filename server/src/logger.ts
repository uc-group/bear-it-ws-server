import * as chalk from 'chalk';

/* eslint-disable no-console */
const levels = ['debug', 'info', 'warn', 'error', 'off'] as string[];
let currentLevel = 0;

const now = () => new Date().toISOString().replace('T', ' ').replace('Z', '');

const log = (color: typeof chalk.Color, ...args: any[]) => {
  console.log(...(args.map((txt) => chalk[color](txt))));
};

export const setLevel = (level: string) => {
  currentLevel = Math.max(0, Math.min(levels.length - 1, levels.indexOf(level)));
};

export default {
  debug(message: string, context?: string[], ...args: any[]) {
    if (currentLevel === 0) {
      log('gray', `[${now()}][debug]${context ? `[${context.join(';')}]` : ''}`, message, ...args);
    }
  },
  info(message: string, context?: string[], ...args: any[]) {
    if (currentLevel <= 1) {
      log('cyan', `[${now()}][info]${context ? `[${context.join(';')}]` : ''}`, message, ...args);
    }
  },
  warn(message: string, context?: string[], ...args: any[]) {
    if (currentLevel <= 2) {
      log('yellow', `[${now()}][warn]${context ? `[${context.join(';')}]` : ''}`, message, ...args);
    }
  },
  error(message: string, context?: string[], ...args: any[]) {
    if (currentLevel <= 3) {
      log('red', `[${now()}][error]${context ? `[${context.join(';')}]` : ''}`, message, ...args);
    }
  },
  trace() {
    if (currentLevel <= 3) {
      console.trace();
    }
  },
};
