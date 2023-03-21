import 'dotenv/config'
import Websocket from './config/websocket';
import RedisClient from './config/redis';
import { BONUS_GAME_DATA_REDIS_TYPE } from './utils/constants';
import { clearUserFreeRouletteTurn } from './server/services/outgame/clearUserFreeRouletteTurn.service';
import RedisMatching from './config/redisMatching';

const init = async () => {
    // await RedisClient.initializer();
    // await RedisMatching.initializer();
    clearUserFreeRouletteTurn()
    const websocket = new Websocket();
    websocket.handlers();
    // await RedisClient.publish("bonus-game-server-start", { type: BONUS_GAME_DATA_REDIS_TYPE.ALL });
}

init();
