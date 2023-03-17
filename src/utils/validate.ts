import { OutgameService } from '../server/services';
import { ParamsValidateUser } from '../server/services/types/interface';
import catchAsync from './catchAsync';
import logger from '../config/logger';

/**
 * Description: Validate info user
 * Created by: NghiaLT(03/02/2023)
 * Edited by: NghiaLT(25/02/2023) - fix API logic validate
 * @param userInfo 
 */
export const validateInfoUser = async (userInfo) => {
  const params: ParamsValidateUser = {
    userId: userInfo.userCodeId,
    miniGameEventId: userInfo.ccData?.miniGameEventId,
    round: userInfo.ccData?.round,
  }
  const token = userInfo.ccData?.token;

  const [error, value] = await catchAsync(OutgameService.validateUser(params, token));

  if(error) {
    return null;
  }
  if(!value || value.status === 400 || value === "UNAUTHORIZED") {
    logger.info(`[WARN][Validate] - validateInfoUser ${userInfo.userCodeId} - validate failed: ${JSON.stringify(value)}`);
    return null;
  }
  return value;
}