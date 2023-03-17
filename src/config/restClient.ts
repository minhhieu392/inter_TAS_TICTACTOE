import { BASE_URL } from '../utils/utils';
import logger from './logger';

import axios from 'axios';
class RestClient {

  private static instance: RestClient;

  constructor() {}

  /**
   *
   *
   * @author LamHa
   * @date 18/01/2023
   * @static
   * @returns {*}  {RestClient}
   * @memberof RestClient
   */
  public static getInstance(): RestClient {
    if (!RestClient.instance) {
      RestClient.instance = new RestClient();
    }

    return RestClient.instance;
  }

  /**
   *
   *
   * @author LamHa
   * @date 18/01/2023
   * @template T
   * @param {string} path
   * @param {*} params
   * @param {string} token
   * @returns {*} 
   * @memberof RestClient
   */
  async post<T>(path: string, params: any, token: string) {
    try {
      logger.info(`[INFO][Rest client] params: ${JSON.stringify(params, null, 4)}`);
      const header = { headers: { 'Authorization': `${token}` }};
      const response = await axios.post<T>(`${BASE_URL}/${path}`, params, header);
      logger.info(`[INFO][Rest client] Path: ${path} has reponse ${JSON.stringify(response.data, null, 4)}`);
      return response.data;
    } catch (errors) {
      logger.error(`[ERROR][Rest client] Path: ${path} has error ${errors}`);
      return { status: 400, message: 'ERROR' }
    }
  };
}

const singletonOutgame = Object.freeze(new RestClient());
export default singletonOutgame;
