// 通过pinia把数据进行管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useUserStore = defineStore(
  'user-data',
  () => {
    const mannerMsg = ref({})
    // 存储管理员信息
    const getMannerInfo = (newMannerInfo) => {
      mannerMsg.value = newMannerInfo
    }
    // 移除管理员信息
    const removeMannerInfo = () => {
      mannerMsg.value = {}
    }
    return {
      mannerMsg,
      getMannerInfo,
      removeMannerInfo,
    }
  },
  // npm install pinia-plugin-persistedstate  让token实现持久化,重启浏览器也不会消失
  {
    persist: true,
  },
)
