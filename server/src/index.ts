import * as express from 'express';
import * as basicAuth from 'express-basic-auth';
import { json } from 'body-parser';
import { createServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';

import Server from './Server';
import SimpleAuth from './auth/SimpleAuth';
import Chat from './systems/Chat';
import config from './config';
import logger, * as Logger from './logger';
import RestApi from './systems/ChatApi';

Logger.setLevel(process.env.NODE_ENV === 'production' ? 'error' : 'debug');

const app = express();

app.use(json());
app.use(basicAuth({
  users: config.authUsers,
}));

const httpServer = createServer(app);
const io = new SocketIoServer(httpServer, {
  cors: {
    origin: config.bearitPublicUrl,
    methods: ['GET', 'POST'],
  },
});

const server = new Server(io, new SimpleAuth());
server.registerSystem(new Chat(new RestApi()));
server.start();

interface ChatChannelCreatedBody {
  room: string,
  event: string,
  message: any
}

app.post('/notify-room', (req, res) => {
  const { room, event, message } = req.body as ChatChannelCreatedBody;
  server.notifyRoom(`notification/${room}`, event, message);
  res.send(req.body);
});

const port = config.port || 3000;
httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  logger.info(`listening on *:${port}`);
});
