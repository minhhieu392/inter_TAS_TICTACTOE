import 'dotenv/config'
import Websocket from './config/websocket';
import RedisClient from './config/redis';
import { clearUserFreeRouletteTurn, delUserInAsyncQueue } from './server/services/outgame/clearUserFreeRouletteTurn.service';
import { initializer as redisInitializer } from "../src/config/redisClientTictactoe"
import connectDB from "../src/config/postgres"

const init = async () => {
    connectDB()
    redisInitializer();
    clearUserFreeRouletteTurn()
    delUserInAsyncQueue()
    const websocket = new Websocket();
    websocket.handlers();
    // await RedisClient.publish("bonus-game-server-start", { type: BONUS_GAME_DATA_REDIS_TYPE.ALL });
}

init();
