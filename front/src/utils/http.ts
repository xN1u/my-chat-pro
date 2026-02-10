import { userStore } from '@/store'
import { message } from 'antd'
import axios, { type AxiosInstance, type InternalAxiosRequestConfig, AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL + '/api'

const http: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json;charset=utf-8' 
  }
})

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = userStore.getState().userToken
    const noAuthPaths = ['/auth/login', '/auth/register']
    if (token && config.headers && !noAuthPaths.includes(config.url || '')) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    message.error('请求发送失败：' + error.message)
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      message.error(res.message || '请求出错')
      return Promise.reject(new Error(res.message || '请求出错'))
    }
    return res.data
  },
  (error: AxiosError) => {
    console.error('HTTP 错误：', error.response?.status, error.message)
    const status = error.response?.status
    switch (status) {
      case 401:
        message.error('未授权/登录过期，请重新登录')
        break
      case 404:
        message.error('请求的接口不存在')
        break
      case 500:
        message.error('服务器内部错误')
        break
      default:
        message.error('请求失败' + error.message)
    }
    return Promise.reject(error)
  }
)

export default http