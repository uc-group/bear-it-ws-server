import { readFileSync } from 'fs';

type Config = {
  bearitUrl: string,
  bearitPublicUrl: string,
  port?: string
};

let config = {
  bearitUrl: 'http://localhost',
  bearitPublicUrl: 'http://localhost',
} as Config;

try {
  config = JSON.parse(readFileSync('./config.json').toString()) as Config;
} catch (e) {
  console.warn('Config file not found');
}

export default { ...config };
