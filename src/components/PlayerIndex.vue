<script setup>
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// 判断是否在播放页面
const isPlayerPage = computed(() => route.path === '/play')
const playerStore = usePlayerStore()
const router = useRouter()
const isDragging = ref(false)
const wasPlaying = ref(false) // 记录拖动前的播放状态
const justFinishedDrag = ref(false) // 标记刚完成拖动，防止触发跳转

// 格式化时间
const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 获取进度百分比（支持拖动时的临时进度）
const displayProgress = ref(0)
const progress = () => {
  if (isDragging.value && playerStore.duration) {
    return displayProgress.value
  }
  if (!playerStore.duration) return 0
  return (playerStore.currentTime / playerStore.duration) * 100
}

// 点击进度条跳转
const handleProgressClick = (e) => {
  const track = e.currentTarget
  const rect = track.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const percentage = clickX / rect.width
  const newTime = percentage * playerStore.duration
  playerStore.seek(newTime)
}

// 开始拖动
const handleDragStart = (e) => {
  isDragging.value = true
  wasPlaying.value = playerStore.isPlaying // 记录当前播放状态

  // 如果正在播放，暂停播放
  if (wasPlaying.value) {
    playerStore.togglePlay()
  }

  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  handleDragMove(e)
}

// 拖动中
const handleDragMove = (e) => {
  if (!isDragging.value) return

  const track = document.querySelector('.progress-track')
  if (!track) return

  const rect = track.getBoundingClientRect()
  let clientX = e.clientX

  // 限制在轨道范围内
  if (clientX < rect.left) clientX = rect.left
  if (clientX > rect.right) clientX = rect.right

  const clickX = clientX - rect.left
  const percentage = clickX / rect.width

  // 只更新显示进度，不跳转音频
  displayProgress.value = percentage * 100

  // 同时更新显示时间（不影响实际播放）
  const newTime = percentage * playerStore.duration
  playerStore.currentTime = newTime
}

// 结束拖动
const handleDragEnd = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)

  // 设置标记，防止触发跳转
  justFinishedDrag.value = true

  // 计算最终位置
  const percentage = displayProgress.value / 100
  const newTime = percentage * playerStore.duration

  // 执行真正的跳转
  playerStore.seek(newTime)

  // 如果之前在播放，恢复播放
  if (wasPlaying.value) {
    playerStore.togglePlay()
  }

  // 重置显示进度
  displayProgress.value = 0
}

// 点击播放器信息区域跳转到播放页面
const goToPlayer = () => {
  // 如果刚完成拖动，不触发跳转
  if (justFinishedDrag.value) {
    // 重置标记
    setTimeout(() => {
      justFinishedDrag.value = false
    }, 100)
    return
  }

  if (playerStore.currentSong.id) {
    router.push({ path: '/play', query: { id: playerStore.currentSong.id } })
  }
}

// 显示当前歌单
const isCurrentSongList = ref(false)

// 关闭播放列表
const closeSongList = () => {
  isCurrentSongList.value = false
}

// 点击播放列表中的歌曲
const playSongFromList = (song) => {
  playerStore.playSong(song)
}

// 跳转到歌手主页
const goToSinger = (singerId) => {
  if (!singerId) return
  router.push({ path: '/singer', query: { id: singerId } })
}
</script>

<template>
  <div
    class="player-index"
    v-if="playerStore.currentSong.id"
    :class="{ dark: isPlayerPage }"
    @click="goToPlayer"
  >
    <div class="player-progress">
      <div class="progress-track" @click.stop="handleProgressClick" @mousedown="handleDragStart">
        <div class="progress-fill" :style="{ width: progress() + '%' }"></div>
        <div class="progress-thumb" :style="{ left: progress() + '%' }"></div>
      </div>
    </div>
    <div class="player-content">
      <div class="player-music-info">
        <div class="player-img" v-if="!isPlayerPage">
          <img class="player-cover-img" :src="playerStore.currentSong.coverImgUrl" alt="" />
        </div>
        <div class="music-name-container">
          <div class="music-name-top">
            <div class="music-name">
              {{ playerStore.currentSong.name }}
            </div>
            <template v-if="playerStore.currentSong.isVip === 1">
              <div class="vip-tag">VIP</div>
            </template>
          </div>
          <div class="player-music-artist-container">
            <template v-if="playerStore.currentSong.singers">
              <template v-for="(singer, index) in playerStore.currentSong.singers" :key="singer.id">
                <span class="player-music-artist" @click.stop="goToSinger(singer.id)">
                  {{ singer.name }}
                </span>
                <span
                  v-if="index < playerStore.currentSong.singers.length - 1"
                  class="artist-separator"
                  >/</span
                >
              </template>
            </template>
            <span v-else class="player-music-artist">{{ playerStore.currentSong.artist }}</span>
          </div>
        </div>
      </div>
      <div class="player-button">
        <div class="btn-last" @click.stop="playerStore.playPrevious">
          <div><CaretLeft /></div>
        </div>
        <div class="btn-play" @click.stop="playerStore.togglePlay">
          <div v-if="!playerStore.isPlaying">
            <VideoPlay />
          </div>
          <div v-else>
            <VideoPause />
          </div>
        </div>
        <div class="btn-next" @click.stop="playerStore.playNext">
          <div><CaretRight /></div>
        </div>
      </div>
      <div class="function-button">
        <div class="btn-cycle" @click.stop="playerStore.togglePlayMode">
          <RefreshRight v-if="playerStore.playMode === 'order'" />
          <!-- 列表循环 -->
          <Refresh v-else-if="playerStore.playMode === 'single'" />
          <!--单曲循环 -->
          <Switch v-else />
          <!-- 随机播放 -->
        </div>
        <div class="btn-music-list" @click.stop="isCurrentSongList = !isCurrentSongList">
          <Operation />
        </div>
      </div>
    </div>
  </div>

  <!-- 播放列表弹窗 -->
  <transition name="slide">
    <div v-if="isCurrentSongList" class="song-list-modal" @click="closeSongList">
      <div class="song-list-container" @click.stop>
        <div class="song-list-header">
          <div class="song-list-title">播放列表</div>
          <div class="song-list-count">{{ playerStore.playList.length }} 首歌曲</div>
          <div class="song-list-close" @click="closeSongList">
            <span>&times;</span>
          </div>
        </div>
        <div class="song-list-content">
          <div
            v-for="(song, index) in playerStore.playList"
            :key="song.id"
            class="song-list-item"
            :class="{ active: song.id === playerStore.currentSong.id }"
            @click="playSongFromList(song)"
          >
            <div class="song-index">{{ index + 1 }}</div>
            <img class="song-cover" :src="song.coverImgUrl" alt="" />
            <div class="song-info" :class="{ active: song.id === playerStore.currentSong.id }">
              <div class="song-name">{{ song.name }}</div>
              <div class="song-artist-container">
                <template v-if="song.isVip === 1">
                  <div class="vip-tag-container">VIP</div>
                </template>
                <div class="song-artist-all">
                  <template v-for="(singer, index) in song.singers || []" :key="singer.id">
                    <span
                      class="song-artist"
                      :class="{ disabled: singer.id === 0 || !singer.id }"
                      @click.stop="singer.id !== 0 && goToSinger(singer.id)"
                    >
                      {{ singer.name }}
                    </span>
                    <span v-if="index < song.singers.length - 1" class="artist-separator">/</span>
                  </template>
                </div>
              </div>
            </div>
            <div class="song-duration">{{ formatTime(song.duration) }}</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.player-index {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80px;
  background-color: #fff;
  padding: 10px 30px;
  &.dark {
    background: linear-gradient(45deg, #333 0%, #000 100%);
    color: #fff;

    .player-progress .progress-track {
      background-color: rgba(255, 255, 255, 0.2) !important;

      .progress-fill {
        background-color: #d1cfcf !important;
      }

      .progress-thumb {
        background-color: #fff !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
      }
    }

    .player-music-artist {
      color: rgba(255, 255, 255, 0.7);
    }

    .btn-last,
    .btn-next {
      color: rgba(255, 255, 255, 0.7) !important;
      &:hover {
        color: #fff !important;
      }
    }

    .btn-play {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: #fff !important;
      &:hover {
        background-color: rgba(255, 255, 255, 0.3) !important;
      }
    }

    .btn-cycle,
    .btn-music-list {
      color: rgba(255, 255, 255, 0.7) !important;
      &:hover {
        color: #fff !important;
      }
    }
  }
  .player-progress {
    position: absolute;
    top: -7px;
    left: 0px;
    right: 0px;
    display: flex;
    align-items: center;
    height: 10px;

    .progress-track {
      flex: 1;
      height: 4px;
      background-color: #e0e0e0;
      border-radius: 2px;
      cursor: pointer;
      position: relative;

      &:hover {
        height: 6px;

        .progress-thumb {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      .progress-fill {
        height: 100%;
        background-color: #ff4d4f;
        border-radius: 2px;
        transition: width 0.1s;
      }

      .progress-thumb {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        width: 12px;
        height: 12px;
        background-color: #ff4d4f;
        border-radius: 50%;
        opacity: 0;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        cursor: grab;

        &:active {
          cursor: grabbing;
        }
      }
    }
  }
  .player-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .player-music-info {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      cursor: pointer;
      .player-img {
        position: relative;
        width: 55px;
        height: 55px;
        margin-right: 10px;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(45deg, #333 0%, #000 100%);
        animation: rotate 20s linear infinite;
        transform: translateZ(0); /* 硬件加速 */
        .player-cover-img {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          height: 70%;
          border-radius: 50%;
          object-fit: cover;
        }
      }
      .music-name-container {
        .music-name-top {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          .music-name {
            font-size: 16px;
            margin-right: 10px;
            line-height: 20px;
          }
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
        }
        .player-music-artist-container {
          display: flex;
          align-items: center;
          .player-music-artist {
            font-size: 16px;
            line-height: 20px;
            color: #a6a3a3;
            cursor: pointer;
            &:hover {
              color: #ff4d4f;
              text-decoration: underline;
            }
          }
          .artist-separator {
            margin: 0 5px;
            color: #a6a3a3;
          }
        }
      }
    }
    .player-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      .btn-last,
      .btn-next {
        width: 35px;
        height: 35px;
        text-align: center;
        color: #605f5f;
        cursor: pointer;
        &:hover {
          color: #000;
        }
      }
      .btn-play {
        width: 50px;
        height: 50px;
        margin: 0 15px;
        border-radius: 50%;
        background-color: #ff4d4f;
        color: #fff;
        cursor: pointer;
        &:hover {
          background-color: #ff3333;
        }
      }
    }
    .function-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      .btn-cycle,
      .btn-music-list {
        margin-left: 20px;
        color: #656464;
        width: 30px;
        height: 30px;
        cursor: pointer;
        &:hover {
          color: #000;
        }
      }
    }
  }
}

/* 播放列表弹窗样式 */
.song-list-modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.song-list-container {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  width: 500px;
  height: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.3s ease;
}

.slide-enter-active .song-list-container,
.slide-leave-active .song-list-container {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from .song-list-container,
.slide-leave-to .song-list-container {
  transform: translateX(100%);
}

.song-list-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  position: relative;
  .song-list-title {
    font-size: 18px;
    font-weight: bold;
    margin-right: 10px;
  }
  .song-list-count {
    font-size: 14px;
    color: #999;
  }
  .song-list-close {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    span {
      font-size: 24px;
      color: #999;
      &:hover {
        color: #000;
      }
    }
  }
}

.song-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.song-list-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #f5f5f5;
  }
  &.active {
    background-color: #f0f0f0;
    .song-name {
      color: #ff4d4f;
    }
    :deep(.song-artist) {
      color: #ff4d4f !important;
    }
  }
  .song-index {
    width: 30px;
    font-size: 14px;
    color: #999;
    text-align: center;
    margin-right: 5px;
  }
  .song-cover {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    margin-right: 12px;
    object-fit: cover;
  }
  .song-info {
    flex: 1;
    min-width: 0;
    &.active {
      .song-artist {
        color: #ff4d4f !important;
      }
    }
    .song-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .song-artist-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      .vip-tag-container {
        padding: 1px 4px;
        border: 1px solid #ff4d4f;
        border-radius: 3px;
        color: #ff4d4f;
        font-size: 12px;
        height: 15px;
        text-align: center;
        margin-right: 5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .song-artist-all {
        display: flex;
        align-items: center;
        .song-artist {
          font-size: 12px;
          color: #999;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          &:hover:not(.disabled) {
            color: #ff4d4f;
            text-decoration: underline;
          }
          &.disabled {
            cursor: default;
            color: #999;
          }
        }
        .artist-separator {
          margin: 0 5px;
          color: #666;
        }
      }
    }
  }
  .song-duration {
    font-size: 12px;
    color: #999;
  }
}
</style>
