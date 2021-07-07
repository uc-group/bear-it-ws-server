import type System from './System';
import logger from '../logger';

export default class SystemLogger {
  constructor(private system: System<any, any>) {}

  public debug(message: string, context?: string[], ...args: any[]) {
    logger.debug(message, [this.system.id(), ...(context || [])], ...args);
  }

  public info(message: string, context?: string[], ...args: any[]) {
    logger.info(message, [this.system.id(), ...(context || [])], ...args);
  }

  public warn(message: string, context?: string[], ...args: any[]) {
    logger.warn(message, [this.system.id(), ...(context || [])], ...args);
  }

  public error(message: string, context?: string[], ...args: any[]) {
    logger.error(message, [this.system.id(), ...(context || [])], ...args);
  }
}
