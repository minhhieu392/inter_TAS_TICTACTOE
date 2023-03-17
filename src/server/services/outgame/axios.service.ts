import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.API_ENDPOINT || 'http://192.168.2.68:8022/',
  headers: {
    common: {
      'Content-Type': 'application/json',
    },
  },
})

class AxiosService {
  private isNotNullOrUndefined(data) {
    return data !== null && data !== undefined
  }

  postService(url = '', body = {}, params?, config = {}, token = '') {
    return new Promise(async (resolve, reject) => {
      if (params) {
        Object.keys(params).forEach((key, index) => {
          const prefix = index ? '&' : '?'
          if (this.isNotNullOrUndefined(params[key])) {
            url += `${prefix}${key}=${params[key]}`
          }
        })
      }
      if (token) {
        instance.defaults.headers.common.Authorization = token
      }
      await instance
        .post(url, body, config)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          if (error.response) {
            resolve(error.response.data)
            return;
          }
          resolve(error)
        })
    })
  }
}

const axiosService = Object.freeze(new AxiosService());
export default axiosService;