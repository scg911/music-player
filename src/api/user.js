import request from '@/utils/request'
export const getLoginKey = () => {
  return request.get('/login/qr/key')
}
export const getQrImage = (key) => {
  return request.get(`/login/qr/create`, {
    params: {
      key,
      timestamp: Date.now(),
      ua: 'pc',
      qrimg: true,
    },
  })
}
export const getQrImageStatus = (key) => {
  return request.get(`/login/qr/check`, {
    params: {
      key,
      timestamp: Date.now(),
      ua: 'pc',
    },
  })
}
export const getLoginStatus = () => {
  return request.get(`/login/status`, {
    params: {
      timestamp: Date.now(),
      ua: 'pc',
    },
  })
}
export const getPhoneLogin = (obj) => {
  const { phone, password } = obj
  return request.get('/login/cellphone', {
    params: {
      phone,
      password,
    },
  })
}
export const getUserInfo = (uid) => {
  return request.get('/user/detail', {
    params: {
      uid,
    },
  })
}
export const getMyMusic = (uid) => {
  return request.get('/user/playlist', {
    params: {
      uid,
    },
  })
}
export const getRecentlyPlay = () => {
  return request.get('/record/recent/song')
}
// 删除音乐
export const deleteMusic = (pid, tracksId) => {
  return request.get('/playlist/tracks', {
    params: {
      op: 'del',
      pid,
      tracks: tracksId,
    },
  })
}
// 退出登录
export const userLogout = () => {
  return request.get('/logout')
}
