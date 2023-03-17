import 'dotenv/config'
import Websocket from './config/websocket';
import RedisClient from './config/redis';
import GameManager from './games/gameManager';
import { BONUS_GAME_DATA_REDIS_TYPE } from './utils/constants';
import { clearUserFreeRouletteTurn } from './server/services/outgame/clearUserFreeRouletteTurn.service';
import RedisMatching from './config/redisMatching';

const init = async () => {
  await RedisClient.initializer();
  await RedisMatching.initializer();
  clearUserFreeRouletteTurn()
  const websocket = new Websocket();
  websocket.handlers();
  global.gameManager = new GameManager();
  await RedisClient.publish("bonus-game-server-start", { type: BONUS_GAME_DATA_REDIS_TYPE.ALL }); // lấy thông tin danh sách bonus game ngay khi tạo server
}

init();
