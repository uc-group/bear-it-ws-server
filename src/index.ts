import { createServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';

import Server from './Server';
import SimpleAuth from './auth/SimpleAuth';
import Chat from './systems/Chat';

const httpServer = createServer();
const io = new SocketIoServer(httpServer, {
  cors: {
    origin: 'http://localhost',
    methods: ['GET', 'POST']
  }
});

const server = new Server(io, new SimpleAuth('http://localhost'));
server.registerSystem(new Chat())

server.start();

httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});