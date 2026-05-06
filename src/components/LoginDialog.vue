<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  getLoginKey,
  getQrImage,
  getQrImageStatus,
  getLoginStatus,
  getPhoneLogin,
} from '@/api/user'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
const router = useRouter()
const userStore = useUserStore()
const dialogStore = useDialogStore()
const isQrLogin = ref(true)
const qrImg = ref('')
const loginKey = ref('')
const getLoginKeyData = async () => {
  const res = await getLoginKey()
  // console.log(res)
  loginKey.value = res.data.unikey
}
const getQrImageData = async (key) => {
  const res = await getQrImage(key)
  // console.log(res)
  qrImg.value = res.data.qrimg
}
watch(
  () => loginKey.value,
  (val) => {
    if (val) {
      getQrImageData(val)
    }
  },
)
// 创建一个定时器，用于检查二维码是否过期
const qrCheckTimer = ref(null)
const startQrCheck = (key) => {
  if (!key) return
  if (qrCheckTimer.value) {
    clearInterval(qrCheckTimer.value)
    qrCheckTimer.value = null
  }
  qrCheckTimer.value = setInterval(async () => {
    const res = await getQrImageStatus(key)
    // console.log(res)
    // 常见状态：800 二维码过期，801 等待扫码，802 已扫码待确认，803 授权成功
    if (res.code === 803) {
      clearInterval(qrCheckTimer.value)
      qrCheckTimer.value = null
      // 授权成功后再调用 login/status 获取完整用户信息
      const statusRes = await getLoginStatus()
      const profile = statusRes.data?.profile || statusRes.profile || statusRes.account
      console.log(profile)
      if (profile) {
        const userInfo = {
          id: profile.userId,
          nickname: profile.nickname,
          avatar: profile.avatarUrl,
        }
        userStore.getMannerInfo(userInfo)
        dialogStore.closeLoginDialog()
      }
    }
  }, 3000)
  // dialogStore.closeLoginDialog()
}
watch(
  () => qrImg.value,
  (val) => {
    if (val && loginKey.value) {
      startQrCheck(loginKey.value)
    }
  },
)
const phoneLoginObj = ref({
  phone: '',
  password: '',
})
const phoneLogin = async () => {
  const res = await getPhoneLogin(phoneLoginObj.value)
  console.log(res)
  const statusRes = await getLoginStatus()
  const profile = statusRes.data?.profile || statusRes.profile || statusRes.account
  console.log(profile)
  if (profile) {
    const userInfo = {
      id: profile.userId,
      nickname: profile.nickname,
      avatar: profile.avatarUrl,
    }
    userStore.getMannerInfo(userInfo)
    dialogStore.closeLoginDialog()
    router.push({ path: '/home' })
  }
}
onMounted(() => {
  getLoginKeyData()
})
</script>

<template>
  <div class="login-dialog">
    <div class="dialog-mask" @click="dialogStore.closeLoginDialog"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">{{ isQrLogin ? '扫码登录' : '手机号登录' }}</div>
        <div class="dialog-close" @click="dialogStore.closeLoginDialog">
          <Close />
        </div>
      </div>
      <div class="dialog-body">
        <div v-if="isQrLogin" class="dialog-body-content">
          <template v-if="qrImg">
            <img :src="qrImg" alt="" />
          </template>
          <template v-else>
            <div class="dialog-body-content-text">二维码加载中...</div>
          </template>
        </div>
        <div v-if="isQrLogin" class="dialog-body-content-footer">请使用二维码登录</div>
        <div v-else class="dialog-body-content-input">
          <div class="dialog-input-label">
            <p>手机号</p>
            <input
              v-model="phoneLoginObj.phone"
              class="dialog-input"
              type="text"
              placeholder="请输入手机号"
            />
          </div>
          <div class="dialog-input-label">
            <p>密码</p>
            <input
              v-model="phoneLoginObj.password"
              class="dialog-input"
              type="password"
              placeholder="请输入密码"
            />
          </div>
          <button @click="phoneLogin" class="dialog-btn">登录</button>
        </div>
        <div @click="isQrLogin = !isQrLogin" class="dialog-footer">选择其他登录模式</div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.login-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  .dialog-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }
  .dialog-content {
    position: relative;
    z-index: 10000;
    width: 400px;
    height: 300px;
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    .dialog-header {
      position: relative;
      .dialog-title {
        font-size: 20px;
        font-weight: bold;
      }
      .dialog-close {
        width: 20px;
        height: 20px;
        position: absolute;
        top: 6px;
        right: 10px;
        cursor: pointer;
      }
    }
    .dialog-body {
      margin: 10px 0;
      .dialog-body-content {
        margin: 0 auto;
        width: 150px;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        .dialog-body-content-text {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          color: #8e8d8d;
          background-color: #e4e3e3;
        }
      }
      .dialog-body-content-input {
        width: 300px;
        height: 200px;
        margin: 0 auto;
        .dialog-input-label {
          .dialog-input {
            margin-top: 5px;
            width: 300px;
            height: 36px;
            margin-bottom: 5px;
            padding: 0 10px;
            border: 1px solid #ccc;
            border-radius: 18px;
          }
        }
        .dialog-btn {
          width: 300px;
          height: 36px;
          margin-top: 10px;
          padding: 0 10px;
          border: none;
          border-radius: 18px;
          background-color: #c20c0c;
          color: #fff;
          cursor: pointer;
        }
      }
      .dialog-body-content-footer {
        // 在一行中显示文本
        font-size: 18px;
        font-weight: bold;
        text-align: center;
      }
      .dialog-footer {
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        margin-top: 5px;
        color: #999;
        cursor: pointer;
      }
    }
  }
}
</style>
