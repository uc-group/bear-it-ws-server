import { createServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';

import Server from './Server';
import SimpleAuth from './auth/SimpleAuth';
import Chat from './systems/Chat';
import config from './config';
import * as Logger from './logger';
import RestApi from './systems/ChatApi';

Logger.setLevel(process.env.NODE_ENV === 'production' ? 'error' : 'debug');

const httpServer = createServer();
const io = new SocketIoServer(httpServer, {
  cors: {
    origin: config.bearitPublicUrl,
    methods: ['GET', 'POST'],
  },
});

const server = new Server(io, new SimpleAuth(config.bearitUrl));
server.registerSystem(new Chat(new RestApi(`${config.bearitUrl}/api`)));

server.start();

const port = config.port || 3000;
httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`listening on *:${port}`);
});
