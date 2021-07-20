import { readFileSync } from 'fs';
import logger from './logger';

type Config = {
  bearitUrl: string,
  bearitPublicUrl: string,
  bearitUsername: string,
  bearitPassword: string,
  port?: string
};

const defaultConfig = {
  bearitUrl: 'http://localhost',
  bearitPublicUrl: 'http://localhost',
  bearitUsername: 'ws',
  bearitPassword: '',
} as Config;

let config: Config = { ...defaultConfig };

try {
  config = { ...config, ...JSON.parse(readFileSync('./config.json').toString()) as Config };
} catch (e) {
  logger.warn('Config file not found');
}

export default { ...config };
