import axios from 'axios';
import config from './config';

const client = axios.create({
  baseURL: `${config.bearitUrl}/internal`,
  auth: {
    username: config.bearitUsername,
    password: config.bearitPassword,
  },
});

export default client;
