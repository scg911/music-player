<script setup>
import { getPlaylistDetail, isUserCollectPlaylist } from '@/api/music'
import { deleteMusic } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import dayjs from 'dayjs'
const router = useRouter()
const userStore = useUserStore()
const playerStore = usePlayerStore()
const formatDate = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD')
}
const route = useRoute()
const playlistId = route.query.id
const playlist = ref({})
const formatPlayCount = (count) => {
  if (count >= 100000000) {
    return (count / 100000000).toFixed(1) + '亿'
  }
  if (count >= 100000) {
    return (count / 10000).toFixed(2) + '万'
  }
  return count
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
const isCollect = ref(false)
const checkIsCollect = async () => {
  try {
    // 根据当前状态决定操作类型
    const t = isCollect.value ? 2 : 1 // 1: 收藏, 2: 取消收藏
    const res = await isUserCollectPlaylist(t, playlistId)

    // 只有接口调用成功时才更新状态
    if (res.code === 200) {
      isCollect.value = !isCollect.value
      console.log('操作成功:', isCollect.value ? '已收藏' : '已取消收藏')
    } else {
      console.error('操作失败:', res.message || '未知错误')
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}
const musicDetail = ref({})
const getPlaylistDetailData = async () => {
  const res = await getPlaylistDetail(playlistId)
  playlist.value = res.playlist
  isCollect.value = playlist.value.subscribed
  musicDetail.value = res.playlist.tracks?.map((item) => {
    const artists = item.ar || item.artists || []
    return {
      id: item.id,
      name: item.name,
      artist: artists.map((artist) => artist.name).join('/'),
      singers: artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
      })),
      duration: item.duration || item.dt || 0, //歌曲时长
      coverImgUrl: item.al?.picUrl || '',
      album: (item.al || item.album)?.name || '',
      isVip: item.fee,
    }
  })
  // 不再自动设置播放列表，只在点击播放时设置
  // console.log(res)
}
// 删除音乐
const deletePlaylistMusic = async (id) => {
  try {
    const res = await deleteMusic(playlist.value.id, id)
    console.log(res)
    // 检查响应结构
    if (res.body && res.body.code === 200) {
      console.log('删除成功')
      getPlaylistDetailData()
    } else if (res.code === 200) {
      // 处理直接返回 code 的情况
      console.log('删除成功')
      getPlaylistDetailData()
    } else {
      console.error('删除失败:', res.body?.message || res.message || '未知错误')
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}
onMounted(() => {
  getPlaylistDetailData()
})
const jumpPaly = (id) => {
  if (!id) return
  // 找到当前点击的歌曲
  const song = musicDetail.value.find((item) => item.id === id)
  const songIndex = musicDetail.value.findIndex((item) => item.id === id)

  if (song) {
    // 切换播放列表为当前歌单，并从点击的歌曲开始播放
    playerStore.setPlayList(musicDetail.value, songIndex)
  }
  router.push({ path: '/play', query: { id } })
}

// 跳转到歌手主页
const goToSinger = (singerId) => {
  if (!singerId) return
  router.push({ path: '/singer', query: { id: singerId } })
}

// 播放全部
const playAll = () => {
  if (musicDetail.value.length === 0) return

  // 设置播放列表为当前歌单的所有歌曲，并从第一首开始播放
  playerStore.setPlayList(musicDetail.value, 0)
}
</script>
<template>
  <div class="main">
    <div class="playlist-header">
      <div class="playlist-cover">
        <div class="paly-icon">
          <div class="icon"><Service /></div>
          <p class="play-count">{{ formatPlayCount(playlist.playCount) }}</p>
        </div>
        <img class="cover-img" :src="playlist.coverImgUrl" alt="" />
      </div>
      <div class="playlist-info">
        <div class="playlist-name">{{ playlist.name }}</div>
        <div class="playlist-desc">{{ playlist.description }}</div>
        <div class="palylist-creator">
          <img class="creator-avatar" :src="playlist.creator?.avatarUrl" alt="" />
          <div class="creator-name">{{ playlist.creator?.nickname }}</div>
          <div class="create-time">{{ formatDate(playlist.createTime) }}创建</div>
        </div>
        <div class="playlist-btn">
          <button class="play-all-btn" @click="playAll">
            <CaretRight style="width: 26px; height: 26px; margin-right: 5px" />播放全部
          </button>
          <button
            v-if="playlist.userId !== userStore.mannerMsg.id"
            class="collect-btn"
            @click="checkIsCollect"
          >
            <template v-if="isCollect">
              <Check style="width: 22px; height: 22px; margin-right: 5px" />
            </template>
            <template v-else>
              <Plus style="width: 22px; height: 22px; margin-right: 5px" />
            </template>
            {{ formatPlayCount(playlist.subscribedCount) }}
          </button>
        </div>
      </div>
    </div>
    <div class="music-list">
      <!-- 表头 -->
      <div class="music-header">
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
        v-for="(item, index) in musicDetail"
        :key="item.id"
        class="music-item"
        :class="{ active: item.id === playerStore.currentSong.id }"
      >
        <div class="music-info-left">
          <div class="music-index">{{ index + 1 }}</div>
          <img class="music-cover" :src="item.coverImgUrl" alt="" />
          <div
            class="music-info"
            :class="{
              active: item.id === playerStore.currentSong.id,
            }"
          >
            <div class="music-name">
              {{ item.name }}
            </div>
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
          <div
            @click="deletePlaylistMusic(item.id)"
            v-if="playlist.userId === userStore.mannerMsg.id"
            class="delete-btn"
          >
            <DeleteFilled style="width: 22px; height: 22px; color: red" />
          </div>
          {{ formatDuration(item.duration) }}
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.main {
  padding: 20px;
  margin: 0 auto;
  width: 70%;
  .playlist-header {
    display: flex;
    margin-bottom: 20px;
    .playlist-cover {
      flex-shrink: 0;
      position: relative;
      margin-right: 20px;
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
          width: 18px;
          height: 18px;
          margin-right: 5px;
        }
        .play-count {
          font-size: 14px;
        }
      }
      .cover-img {
        width: 200px;
        height: 200px;
        border-radius: 10px;
      }
    }
    .playlist-info {
      display: flex;
      flex-direction: column;
      min-height: 200px;
      .playlist-name {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .playlist-desc {
        font-size: 16px;
        color: #666;
        margin-bottom: 10px;
        // 最多显示两行
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .palylist-creator {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: 10px;
        .creator-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 10px;
        }
        .creator-name {
          font-size: 16px;
          font-weight: bold;
        }
        .create-time {
          margin-left: 10px;
          font-size: 14px;
          color: #666;
        }
      }
      .playlist-btn {
        margin-top: auto;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 10px;
      }
      .play-all-btn {
        padding: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 120px;
        height: 40px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        background-color: #ff4d4f;
        color: #fff;
      }
      .collect-btn {
        color: #000;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 120px;
        height: 40px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        // 半透明模糊背景
        background-color: rgba(205, 203, 203, 0.5);
        backdrop-filter: blur(10px);
      }
    }
  }
  .music-list {
    .music-header {
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
      &.active {
        background-color: #f5f5f5;
      }
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
          &.active {
            .music-name,
            .artist-name {
              color: #ff4d4f;
            }
          }
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
  }
}
</style>
