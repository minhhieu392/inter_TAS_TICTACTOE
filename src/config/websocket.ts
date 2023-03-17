import { WebSocket, Server } from 'ws';
import router from '../server/routes/v1/websocket';
import { PORT, ENV, JWT_SECRET } from '../utils/utils';
import logger from '../config/logger';
import { authorize } from '../server/middleware/auth.middleware';
import url from 'url';
import app from './express';
import { toArrayBuffer, encodeMessage, decodeMessage } from '../utils/helpers';
import catchAsync from '../utils/catchAsync';

export const clients = new Map<string, WebSocket>();;

export default class MyWebSocket {
    private server: Server;
    private serverHTTP: any;
    constructor() {
        let WSServer = WebSocket.Server;
        this.serverHTTP = require('http').createServer();
        this.server = new WSServer({
            server: this.serverHTTP,
        })
        // this.server = new WebSocket.Server({ port: Number(PORT) });
        // logger.info(`Websocket server started on port ${PORT} (${ENV})`);
        this.serverHTTP.on('request', app);
        this.serverHTTP.listen(PORT, async () => {
            logger.info(`App listening on ${PORT} (${ENV})`);
        })
    }

    private authen = (socket: WebSocket, req: any) => {
        var token = url.parse(req.url, true).query.token;
        if (!token) {
            socket.close();
        }
        if (!authorize(token)) {
            socket.close();
        }
    }

    public handlers = () => {

        this.server.on('connection', (socket, req) => {
            logger.info(`Connected ... ${req.socket.remoteAddress}`);
            const websocketRouter = new router(socket);
            websocketRouter.listeners();
        });
    }

}
