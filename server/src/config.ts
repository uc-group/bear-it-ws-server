import { readFileSync } from 'fs';
import logger from './logger';

type Credentials = {
  [username: string]: string
};

type Config = {
  bearitUrl: string,
  bearitPublicUrl: string,
  bearitUsername: string,
  bearitPassword: string,
  port?: string,
  authUsers: Credentials
};

const defaultConfig = {
  bearitUrl: 'http://localhost',
  bearitPublicUrl: 'http://localhost',
  bearitUsername: 'ws',
  bearitPassword: '',
  authUsers: {},
} as Config;

let config: Config = { ...defaultConfig };

try {
  config = { ...config, ...JSON.parse(readFileSync('./config.json').toString()) as Config };
} catch (e) {
  logger.warn('Config file not found');
}

export default { ...config };
