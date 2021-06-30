import type System from './System';
import logger from '../logger';

export default class SystemLogger {
  constructor(private system: System<any, any>) {}

  public debug(...args: any[]) {
    logger.debug(`[${this.system.id()}]`, ...args);
  }

  public info(...args: any[]) {
    logger.info(`[${this.system.id()}]`, ...args);
  }

  public warn(...args: any[]) {
    logger.warn(`[${this.system.id()}]`, ...args);
  }

  public error(...args: any[]) {
    logger.error(`[${this.system.id()}]`, ...args);
  }
}
