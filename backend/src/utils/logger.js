// Tiny console logger with levels, so we need no extra dependency. Silent during tests.
import { env } from '../config/env.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = env.NODE_ENV === 'test' ? Infinity : env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;

const log = (level, args) => {
  if (LEVELS[level] < threshold) return;
  console[level === 'debug' ? 'log' : level](`[${new Date().toISOString()}] ${level.toUpperCase()}`, ...args);
};

export const logger = {
  debug: (...args) => log('debug', args),
  info: (...args) => log('info', args),
  warn: (...args) => log('warn', args),
  error: (...args) => log('error', args),
};
