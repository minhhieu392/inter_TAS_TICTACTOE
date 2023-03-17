import { Server, Socket } from 'socket.io';
import { Server  as httpServer } from 'http';
// import Solitaire from '../api/controllers/solitaire.controller';
import router from '../server/routes/v1/websocket';
import { authorize } from '../server/middleware/auth.middleware';
import logger from '../config/logger';
import User from '../games/general/user';

const WEBSOCKET_CORS = {
  origin: "*",
  methods: ["GET", "POST"],
  transports: ['websocket', 'polling'],
  credentials: true
};

class Websocket extends Server {
  private static io: Websocket;

  constructor(httpServer: httpServer) {
    super(httpServer, {
      cors: WEBSOCKET_CORS,
      allowEIO3: true
    });
  }

  public static getInstance(httpServer: httpServer): Websocket {
    if (!Websocket.io) {
        Websocket.io = new Websocket(httpServer);
        this.handlers();
    }
    return Websocket.io;
  }

  private static handlers() {
    // this.io.use(authorize);
    this.io.on('connection', socket => {
      logger.info(`Connecting ... ${ socket.id }`)
      // new Solitaire(socket);
      new router(socket);
      new User(socket);
      
      socket.on('message', message => {
        logger.info(`'Receiving ... ${ message }`);
      });
    
      socket.on('disconnect',  () => {
        logger.warn(`Client disconnected`);
      });
    
    });
  }

}

export default Websocket;