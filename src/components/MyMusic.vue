<script setup>
import { getUserInfo, getMyMusic, getRecentlyPlay } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/player'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDialogStore } from '@/stores/dialog'
const dialogStore = useDialogStore()
const playerStore = usePlayerStore()
const router = useRouter()
const userInfo = ref({})
const getUserInfoDetail = async () => {
  const res = await getUserInfo(userStore.mannerMsg.id)
  userInfo.value = res
  // console.log(userInfo.value)
}
const myPlaylist = ref([])
const getMyMusicList = async () => {
  const res = await getMyMusic(userStore.mannerMsg.id)
  myPlaylist.value = res.playlist
  // console.log(myPlaylist.value)
}
const formatPlayCount = (count) => {
  if (count >= 100000000) {
    return (count / 100000000).toFixed(1) + '亿'
  }
  if (count >= 100000) {
    return (count / 10000).toFixed(2) + '万'
  }
  return count
}
const activechange = ref(true)

const toggleActive = (isActive) => {
  activechange.value = isActive
}
const formatDuration = (ms) => {
  // 转换为秒
  const seconds = Math.floor(ms / 1000)
  // 计算分钟
  const minutes = Math.floor(seconds / 60)
  // 计算剩余秒数
  const remainingSeconds = seconds % 60
  // 格式化为 MM:SS 格式，分钟和秒数都补零
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}
const recentlyPlay = ref([])
const getRecentlyPlayList = async () => {
  const res = await getRecentlyPlay()
  recentlyPlay.value = res.data.list.map((item) => {
    const song = item.data // 取出内层真实数据
    const artists = song.ar || song.artists || []
    return {
      id: song.id,
      name: song.name,
      artist: artists.map((artist) => artist.name).join('/'),
      singers: artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      })),
      duration: song.duration || song.dt || 0,
      coverImgUrl: song.al?.picUrl || '',
      album: (song.al || song.album)?.name || '',
      isVip: song.fee,
    }
  })
  // playerStore.playList = recentlyPlay.value
  // console.log(recentlyPlay.value)
}
onMounted(() => {
  getUserInfoDetail()
  getMyMusicList()
  getRecentlyPlayList()
})
const jumpPalylist = (id) => {
  if (!id) return
  router.push({ path: '/playlist', query: { id } })
}
const jumpPaly = (id) => {
  if (!id) return

  // 找到点击的歌曲
  const song = recentlyPlay.value.find((item) => item.id === id)
  if (!song) return

  // 如果播放列表不为空
  if (playerStore.playList.length > 0) {
    // 找到当前播放歌曲的索引
    let currentIndex = playerStore.playList.findIndex(
      (item) => item.id === playerStore.currentSong.id,
    )

    // 检查播放列表中是否已存在这首歌
    const existingIndex = playerStore.playList.findIndex((item) => item.id === id)

    // 如果存在，先删除旧的
    if (existingIndex !== -1) {
      playerStore.playList.splice(existingIndex, 1)
      // 如果删除的是当前歌曲之前的或当前歌曲，需要调整索引
      if (existingIndex <= currentIndex && currentIndex > 0) {
        currentIndex--
      }
    }

    // 计算插入位置（当前歌曲的下一首）
    const insertIndex = currentIndex >= 0 ? currentIndex + 1 : 0

    // 插入到当前歌曲的下一首
    playerStore.playList.splice(insertIndex, 0, song)

    // 设置当前歌曲索引并播放
    playerStore.currentSongIndex = insertIndex
    playerStore.currentSong = song
    playerStore.isPlaying = true
    playerStore.playSong(song)
  } else {
    // 如果播放列表为空，直接播放
    playerStore.playList = [song]
    playerStore.currentSongIndex = 0
    playerStore.currentSong = song
    playerStore.isPlaying = true
    playerStore.playSong(song)
  }

  router.push({ path: '/play', query: { id } })
}

// 跳转到歌手主页
const goToSinger = (singerId) => {
  if (!singerId) return
  router.push({ path: '/singer', query: { id: singerId } })
}
const userStore = useUserStore()
</script>
<template>
  <div v-if="userStore.mannerMsg.id" class="my-music">
    <div
      class="music-header"
      :style="{
        backgroundImage: `url(${userInfo.profile?.backgroundUrl})`,
      }"
    >
      <div class="header-avatar">
        <img class="avatar" :src="userStore.mannerMsg.avatar" alt="" />
      </div>
      <div class="header-info">
        <h2>{{ userStore.mannerMsg.nickname }}</h2>
        <div class="header-info-detail">
          <span>关注：{{ userInfo.profile?.follows }}</span>
          <span>粉丝：{{ userInfo.profile?.followeds }}</span>
        </div>
      </div>
    </div>
    <div class="my-music-menu">
      <p class="playlist-title" :class="{ active: activechange }" @click="toggleActive(true)">
        最近播放
      </p>
      <p class="playlist-title" :class="{ active: !activechange }" @click="toggleActive(false)">
        我的歌单
      </p>
    </div>
    <div v-if="activechange" class="music-content">
      <!-- 表头 -->
      <div class="music-header-container">
        <div class="music-header-left">
          <div class="music-header-index">序号</div>
          <div class="music-header-info">歌曲</div>
        </div>
        <div class="music-header-middle">专辑</div>
        <div class="music-header-right">时长</div>
      </div>
      <!-- 歌曲列表 -->
      <div
        @click="jumpPaly(item.id)"
        v-for="(item, index) in recentlyPlay"
        :key="item.id"
        class="music-item"
      >
        <div class="music-info-left">
          <div class="music-index">{{ index + 1 }}</div>
          <img class="music-cover" :src="item.coverImgUrl" alt="" />
          <div class="music-info">
            <div class="music-name">{{ item.name }}</div>
            <div class="music-artist-tag">
              <template v-if="item.isVip === 1">
                <div class="vip-tag">VIP</div>
              </template>
              <div class="artist-name-container">
                <template v-for="(singer, index) in item.singers" :key="singer.id">
                  <span class="artist-name" @click.stop="goToSinger(singer.id)">
                    {{ singer.name }}
                  </span>
                  <span v-if="index < item.singers.length - 1" class="artist-separator">/</span>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="music-info-middle">{{ item.album }}</div>
        <div class="music-info-right">
          <div @click="deletePlaylistMusic(item.id)" class="delete-btn">
            <DeleteFilled style="width: 22px; height: 22px; color: red" />
          </div>
          {{ formatDuration(item.duration) }}
        </div>
      </div>
    </div>
    <div v-else class="music-content">
      <div class="content-playlist">
        <div
          @click="jumpPalylist(item.id)"
          v-for="item in myPlaylist"
          :key="item.id"
          class="playlist-item"
        >
          <div class="paly-icon" v-if="item.playCount > 0">
            <div class="icon"><Service /></div>
            <p class="play-count">{{ formatPlayCount(item.playCount) }}</p>
          </div>
          <div class="img-container">
            <img class="playlist-item-cover" :src="item.coverImgUrl" alt="" />
            <div class="hover-overlay">
              <div class="play-icon">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div class="playlist-item-info">
            <h4 class="info-title">{{ item.name }}</h4>
            <p class="listen-count">{{ item.trackCount }}首</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="no-login">
      <h2 class="title">私人音乐空间，听我想听的歌</h2>
      <h4 class="desc">登录管理我的音乐，多终端同步</h4>
      <div @click="dialogStore.openLoginDialog" class="login-btn">登录</div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.my-music {
  width: 100%;
  .music-header {
    margin-bottom: 20px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    .header-avatar {
      margin: 20px 0;
      .avatar {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        border: 5px solid #fff;
      }
    }
    .header-info {
      color: #fff;
      margin-bottom: 20px;
      .header-info-detail {
        margin-top: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        span {
          margin-right: 20px;
        }
      }
    }
  }
  .my-music-menu {
    margin: 0 auto;
    padding-top: 20px;
    padding-left: 20px;
    width: 80%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 20px;
    .playlist-title {
      font-size: 24px;
      font-weight: bold;
      margin-right: 30px;
      cursor: pointer;
      position: relative;
      &.active::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 8px;
        background-color: #fc2828;
        border-radius: 4px;
      }
    }
  }
  .music-content {
    width: 80%;
    padding: 20px;
    margin: 0 auto;
    .music-header-container {
      width: 100%;
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding: 0 10px;
      background-color: #f5f5f5;
      border-radius: 10px;
      font-size: 14px;
      font-weight: bold;
      color: #666;
      .music-header-left {
        display: flex;
        align-items: center;
        .music-header-index {
          width: 40px;
          margin-right: 12px; /* 与下面的 music-index + music-cover 宽度对齐 */
        }
        .music-header-info {
          width: 300px;
        }
      }
      .music-header-middle {
        padding-left: 33px;
        width: 300px;
        text-align: left;
      }
      .music-header-right {
        width: 100px;
        text-align: right;
      }
    }
    .music-item {
      width: 100%;
      height: 80px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 10px;
      &:hover {
        background-color: #f5f5f5;
        &:hover .delete-btn {
          opacity: 1;
        }
      }

      .music-info-left {
        display: flex;
        align-items: center;
        .music-index {
          width: 40px;
          font-size: 16px;
          font-weight: bold;
          margin-right: 10px;
        }
        .music-cover {
          width: 60px;
          height: 60px;
          border-radius: 5px;
          margin-right: 10px;
        }
        .music-info {
          display: flex;
          flex-direction: column;
          width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          .music-name {
            font-size: 16px;
            font-weight: bold;
          }
          .music-artist-tag {
            display: flex;
            align-items: center;
            color: #666;
            .vip-tag {
              padding: 1px 4px;
              border: 1px solid #ff4d4f;
              border-radius: 3px;
              color: #ff4d4f;
              font-size: 12px;
              height: 18px;
              text-align: center;
              margin-right: 5px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .artist-name-container {
              display: flex;
              align-items: center;
              .artist-name {
                font-size: 14px;
                cursor: pointer;
                &:hover {
                  color: #ff4d4f;
                  text-decoration: underline;
                }
              }
              .artist-separator {
                margin: 0 5px;
                color: #666;
              }
            }
          }
        }
      }
      .music-info-middle {
        width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
        font-size: 16px;
        font-weight: bold;
      }
      .music-info-right {
        position: relative;
        width: 100px;
        text-align: right;
        font-size: 14px;
        color: #666;
        .delete-btn {
          position: absolute;
          top: 0;
          right: 150px;
          z-index: 2;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }
    }
    .content-playlist {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      grid-gap: 20px;
      .playlist-item {
        position: relative;
        transition: all 0.3s ease-in-out;
        &:hover {
          transform: scale(1.1);
        }
        width: 100%;
        .paly-icon {
          display: flex;
          align-items: center;
          font-weight: 700;
          position: absolute;
          top: 10px;
          right: 20px;
          color: #fff;
          z-index: 2;
          .icon {
            width: 20px;
            height: 20px;
            margin-right: 5px;
          }
          .play-count {
            font-size: 18px;
          }
        }
        .img-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;

          .playlist-item-cover {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 10px;
          }
          display: block;

          .hover-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          &:hover .hover-overlay {
            opacity: 1;
          }
          .play-icon {
            color: #fff;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }
        }

        .playlist-item-info {
          margin: 0 auto;
          width: 90%;
          margin-top: 10px;
          .info-title {
            // 超出显示省略号
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 18px;
            font-weight: bold;
          }
          .listen-count {
            font-size: 14px;
            color: #999;
          }
        }
      }
    }

    // 响应式调整
    @media (max-width: 768px) {
      .content-playlist {
        grid-template-columns: repeat(2, 1fr);
      }
      .music-content {
        width: 95%;
      }
    }

    @media (max-width: 480px) {
      .content-playlist {
        grid-template-columns: 1fr;
      }
    }
  }
}
.no-login {
  text-align: center;
  height: calc(100vh - 100px);
  background: url(https://y.qq.com/ryqq/static/media/bg_profile_unlogin.69aad5de.jpg?max_age=2592000)
    50% no-repeat;
  background-size: cover;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .title {
    font-size: 50px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 20px;
  }
  .desc {
    font-size: 30px;
    font-weight: 400;
    margin-bottom: 20px;
    color: #fff;
  }
  .login-btn {
    width: 200px;
    font-size: 24px;
    font-weight: bold;
    color: #fff;
    background: #ff4d4f;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
  }
}
</style>
