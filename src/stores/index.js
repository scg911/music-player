// 将pinia进行统一管理,就不用和main.js放在一起管理了
import { createPinia } from 'pinia'
import persist from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(persist)
export default pinia
export * from './user'
export * from './player'
