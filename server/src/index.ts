import { createServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';

import Server from './Server';
import SimpleAuth from './auth/SimpleAuth';
import Chat from './systems/Chat';
import config from './config';

const httpServer = createServer();
const io = new SocketIoServer(httpServer, {
  cors: {
    origin: config.bearitPublicUrl,
    methods: ['GET', 'POST'],
  },
});

const server = new Server(io, new SimpleAuth(config.bearitUrl));
server.registerSystem(new Chat(`${config.bearitUrl}/api`));

server.start();

const port = config.port || 3000;
httpServer.listen(port, () => {
  console.log(`listening on *:${port}`);
});
