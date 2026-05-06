<script setup>
import { useRoute } from 'vue-router'
import { getMusicDetail, getLiteralLyrics } from '@/api/music'
import { onMounted, ref, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const route = useRoute()

const musicDetail = ref({})
const lyrics = ref([])
const currentLyricIndex = ref(-1)

// 唱片旋转角度
const rotation = ref(0)
let rotationInterval = null

// 开始旋转
const startRotation = () => {
  if (rotationInterval) return
  rotationInterval = setInterval(() => {
    rotation.value += 1.8 // 每秒旋转约65度，20秒转一圈
  }, 100)
}

// 停止旋转
const stopRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
}

// 监听播放状态控制旋转
watch(
  () => playerStore.isPlaying,
  (isPlaying) => {
    if (isPlaying) {
      startRotation()
    } else {
      stopRotation()
    }
  },
  { immediate: true },
)

const parseLyrics = (lyricStr) => {
  const lyrics = []
  const lines = lyricStr.split('\n')

  lines.forEach((line) => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
    if (match) {
      const [, minutes, seconds, ms, text] = match
      const timestamp = parseInt(minutes) * 60 * 1000 + parseInt(seconds) * 1000 + parseInt(ms)
      lyrics.push({ timestamp, text })
    }
  })

  return lyrics
}

const getMusicDetailData = async (songId) => {
  const res = await getMusicDetail(songId)
  musicDetail.value = res.songs.map((item) => ({
    id: item.id,
    name: item.name,
    artist: (item.ar || item.artists || []).map((artist) => artist.name).join('/'),
    duration: item.duration || item.dt || 0,
    coverImgUrl: item.al?.picUrl || '',
    album: (item.al || item.album)?.name || '',
    isVip: item.fee,
  }))
}

const getLiteralLyricsData = async (songId) => {
  lyrics.value = []
  currentLyricIndex.value = -1

  const res = await getLiteralLyrics(songId)
  if (res.code === 200 && res.lrc && res.lrc.lyric) {
    lyrics.value = parseLyrics(res.lrc.lyric)
  }
}

// 加载歌曲数据
const loadSongData = async (songId) => {
  if (!songId) return

  await Promise.all([getMusicDetailData(songId), getLiteralLyricsData(songId)])
}

// 监听播放器时间变化来更新歌词
watch(
  () => playerStore.currentTime,
  (newTime) => {
    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (lyrics.value[i].timestamp <= newTime) {
        currentLyricIndex.value = i
        scrollToCurrentLyric()
        break
      }
    }
  },
)

// 监听当前歌曲变化，自动更新页面
watch(
  () => playerStore.currentSong.id,
  (newSongId) => {
    if (newSongId) {
      loadSongData(newSongId)
    }
  },
  { immediate: true },
)

const scrollToCurrentLyric = () => {
  const lyricElement = document.querySelector('.current-lyric')
  if (lyricElement) {
    const container = document.querySelector('.lyrics-container')
    const containerHeight = container.clientHeight
    const lyricTop = lyricElement.offsetTop
    const lyricHeight = lyricElement.clientHeight

    const targetScrollTop = lyricTop - containerHeight / 3 + lyricHeight / 2

    const currentScrollTop = container.scrollTop
    const distance = targetScrollTop - currentScrollTop
    const duration = 300
    const startTime = performance.now()

    const scrollAnimation = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      container.scrollTop = currentScrollTop + distance * easeProgress

      if (progress < 1) {
        requestAnimationFrame(scrollAnimation)
      }
    }

    requestAnimationFrame(scrollAnimation)
  }
}

onMounted(() => {
  // 如果playerStore中没有歌曲，尝试从URL参数加载
  if (!playerStore.currentSong.id && route.query.id) {
    loadSongData(route.query.id)
  }
})
</script>
<template>
  <div class="music-player">
    <div class="player-left">
      <div class="music-container">
        <div class="music-cover-container" :style="{ transform: `rotate(${rotation}deg)` }">
          <img
            class="music-cover"
            :src="playerStore.currentSong.coverImgUrl || musicDetail[0]?.coverImgUrl"
            alt=""
          />
        </div>
      </div>
    </div>
    <div class="player-right">
      <div class="music-info">
        <div class="music-name-container">
          <div class="music-name">
            {{ playerStore.currentSong.name || musicDetail[0]?.name }}
          </div>
          <template v-if="playerStore.currentSong.isVip === 1 || musicDetail[0]?.isVip === 1">
            <div class="vip-tag">VIP</div>
          </template>
        </div>
        <div class="music-artist">
          <div class="music-artist-album">
            专辑：{{ playerStore.currentSong.album || musicDetail[0]?.album }}
          </div>
          <div class="music-artist-name">
            歌手：{{ playerStore.currentSong.artist || musicDetail[0]?.artist }}
          </div>
        </div>
      </div>
      <div class="lyrics-container">
        <div
          v-for="(lyric, index) in lyrics"
          :key="index"
          :class="{ 'current-lyric': index === currentLyricIndex }"
        >
          {{ lyric.text }}
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.music-player {
  height: 100vh;
  color: #fff;
  background: radial-gradient(circle at top left, #2b2b2b, #000);
  display: flex;
  justify-content: space-around;
  align-items: center;
  .player-left {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    .music-container {
      display: flex;
      justify-content: center;
      align-items: center;
      .music-cover-container {
        position: relative;
        width: 360px;
        height: 360px;
        border-radius: 50%;
        background: linear-gradient(45deg, #333 0%, #000 100%);
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
        overflow: hidden;
        transition: transform 0.1s linear; /* 平滑过渡 */
        .music-cover {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          height: 70%;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
      }
    }
  }
  .player-right {
    position: relative;
    flex: 1;
    height: 100vh;
    .music-info {
      position: absolute;
      top: 50px;
      left: 0;
      width: 80%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .music-name-container {
        display: flex;
        align-items: center;
        .music-name {
          font-size: 30px;
          font-weight: 500;
          margin-bottom: 5px;
          margin-right: 10px;
        }
        .vip-tag {
          padding: 1px 4px;
          border: 1px solid #fff;
          border-radius: 3px;
          color: #fff;
          font-size: 12px;
          height: 18px;
          text-align: center;
          margin-right: 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      }
      .music-artist {
        display: flex;
        align-items: center;
        color: #a6a3a3;
        .music-artist-album {
          margin-right: 20px;
        }
      }
    }
    .lyrics-container {
      position: absolute;
      top: 150px;
      left: 0;
      width: 80%;
      height: 490px;
      overflow-y: auto;
      padding: 20px 0;
      -ms-overflow-style: none;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      div {
        margin: 12px 0;
        text-align: left;
        color: #a6a3a3;
        font-size: 18px;
        line-height: 1.6;
        transition: all 0.3s ease;
      }

      .current-lyric {
        color: #fff;
        font-weight: bold;
        font-size: 22px;
      }
    }
  }
}
</style>
