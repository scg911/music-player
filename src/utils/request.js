import axios from 'axios'

const baseURL = 'http://localhost:3000'

const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000, // 增加超时时间
  withCredentials: true, // 保持 cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：可以统一添加 token
instance.interceptors.request.use(
  (config) => {
    // 添加 token
    // const token = localStorage.getItem("token")
    // if(token){
    //     config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一处理 code / 错误
instance.interceptors.response.use(
  (response) => {
    // 假设后端返回:{code,data,message}
    const res = response.data
    return res
  },
  (error) => {
    // 处理全局错误提示
    // 如：网络错误、401、未登录等
    return Promise.reject(error)
  },
)

export default instance
