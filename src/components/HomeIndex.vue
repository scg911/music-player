<script setup>
import { getRecommendedPlaylist, getRankinglist, getNewMusic } from '@/api/music'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
const playerStore = usePlayerStore()
const router = useRouter()

// 通用轮播工具函数
const useCarousel = (items, perPage) => {
  const index = ref(0)
  const showControls = ref(false)

  const total = computed(() => Math.ceil(items.value.length / perPage))
  const displayed = computed(() => {
    const start = index.value * perPage
    return items.value.slice(start, start + perPage)
  })

  const left = () => {
    index.value = (index.value - 1 + total.value) % total.value
  }

  const right = () => {
    index.value = (index.value + 1) % total.value
  }

  return { total, displayed, left, right, showControls }
}

const recommendedPlaylist = ref([])
const newMusic = ref([])
const rankinglist = ref([])

const formatPlayCount = (count) => {
  if (count >= 100000000) {
    return (count / 100000000).toFixed(1) + '亿'
  }
  if (count >= 100000) {
    return (count / 10000).toFixed(2) + '万'
  }
  return count
}

const getRecommendedPlaylistData = async () => {
  const res = await getRecommendedPlaylist()
  recommendedPlaylist.value = res.result
}

const getRankinglistData = async () => {
  const res = await getRankinglist()
  rankinglist.value = res.list
    .map((item) => {
      return {
        id: item.id,
        name: item.name,
        coverImgUrl: item.coverImgUrl,
        updateFrequency: item.updateFrequency,
        tracks: item.tracks.map((track) => `${track.first} - ${track.second}`),
      }
    })
    .slice(0, 6)
}

const getNewMusicData = async () => {
  const res = await getNewMusic()
  newMusic.value = res.data
    .map((item) => {
      const artists = item.ar || item.artists || []
      return {
        id: item.id,
        name: item.name,
        artist: artists.map((artist) => artist.name).join('/'),
        singers: artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
        coverImgUrl: item.album.blurPicUrl || '',
        duration: item.duration,
        isVip: item.fee,
      }
    })
    .slice(0, 45)
  // console.log(res)
}

// 推荐歌单轮播
const {
  total: totalPages,
  displayed: displayedPlaylist,
  left: goLeft,
  right: goRight,
  showControls,
} = useCarousel(recommendedPlaylist, 5)

// 新歌推荐轮播
const {
  total: totalNewMusicPages,
  displayed: displayedNewMusic,
  left: newMusicGoLeft,
  right: newMusicGoRight,
  showControls: showNewMusicControls,
} = useCarousel(newMusic, 9)

onMounted(() => {
  getRecommendedPlaylistData()
  getRankinglistData()
  getNewMusicData()
})

// 跳转到歌手主页
const goToSinger = (singerId) => {
  if (!singerId) return
  router.push({ path: '/singer', query: { id: singerId } })
}

const jumpPaly = (id) => {
  if (!id) return

  // 找到点击的歌曲
  const song = newMusic.value.find((item) => item.id === id)
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
    playerStore.setPlayList([song], 0)
  }

  router.push({ path: '/play', query: { id } })
}

const jumpPalylist = (id) => {
  if (!id) return
  router.push({ path: '/playlist', query: { id } })
}
</script>
<template>
  <div class="main">
    <div
      class="recommended-playlist"
      @mouseenter="showControls = true"
      @mouseleave="showControls = false"
    >
      <div class="title">
        <span>推荐歌单</span>
      </div>
      <div class="playlist-carousel">
        <transition name="slide-left">
          <button v-if="showControls && totalPages > 1" class="carousel-btn left" @click="goLeft">
            <ArrowLeftBold />
          </button>
        </transition>
        <div class="playlist-list">
          <div
            v-for="item in displayedPlaylist"
            :key="item.id"
            class="playlist-item"
            @click="jumpPalylist(item.id)"
          >
            <div class="paly-icon">
              <div class="icon"><Service /></div>
              <p class="play-count">{{ formatPlayCount(item.playCount) }}</p>
            </div>
            <div class="img-container">
              <img class="playlist-img" :src="item.picUrl" alt="" />
              <div class="hover-overlay">
                <div class="play-icon">
                  <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="playlist-info">
              <div class="name">{{ item.name }}</div>
              <div v-if="item.copywriter" class="desc">{{ item.copywriter }}</div>
            </div>
          </div>
        </div>
        <transition name="slide-right">
          <button v-if="showControls && totalPages > 1" class="carousel-btn right" @click="goRight">
            <ArrowRightBold />
          </button>
        </transition>
      </div>
    </div>
    <div class="top-picks">
      <div class="picks-title">
        <span>精选榜单</span>
      </div>
      <div class="picks-list">
        <div
          @click="jumpPalylist(item.id)"
          v-for="item in rankinglist"
          :key="item.id"
          class="picks-item"
        >
          <div class="picks-info">
            <div class="picks-name">{{ item.name }}</div>
            <div class="picks-frequency">{{ item.updateFrequency }}</div>
          </div>
          <div class="picks-content">
            <div class="picks-img">
              <img :src="item.coverImgUrl" alt="" />
            </div>
            <div class="picks-tracks">
              <div v-for="(track, index) in item.tracks" :key="index" class="track-item">
                {{ index + 1 }}.{{ track }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="new-music"
      @mouseenter="showNewMusicControls = true"
      @mouseleave="showNewMusicControls = false"
    >
      <div class="new-music-title">
        <span>新歌推荐</span>
      </div>
      <div class="new-music-carousel">
        <transition name="slide-left">
          <button
            v-if="showNewMusicControls && totalNewMusicPages > 1"
            class="carousel-btn left"
            @click="newMusicGoLeft"
          >
            <ArrowLeftBold />
          </button>
        </transition>
        <div class="new-music-grid">
          <div
            v-for="item in displayedNewMusic"
            :key="item.id"
            class="new-music-item"
            @click="jumpPaly(item.id)"
          >
            <div class="new-music-img">
              <img class="music-img" :src="item.coverImgUrl" alt="" />
            </div>
            <div class="new-music-info">
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
        </div>
        <transition name="slide-right">
          <button
            v-if="showNewMusicControls && totalNewMusicPages > 1"
            class="carousel-btn right"
            @click="newMusicGoRight"
          >
            <ArrowRightBold />
          </button>
        </transition>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.main {
  width: 1200px;
  margin: 0 auto;
  .recommended-playlist {
    width: 100%;
    padding-top: 20px;
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      .carousel-controls {
        margin-left: 20px;
        font-size: 14px;
        color: #666;
      }
    }
    .playlist-carousel {
      position: relative;
      display: flex;
      align-items: center;
      .playlist-list {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        flex: 1;
      }
      .carousel-btn {
        position: absolute;
        top: 40%;

        transform: translateY(-50%);
        width: 50px;
        height: 80px;
        border: none;
        background-color: #e5e3e3;
        color: #333;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.3s;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        &.left {
          left: -100px;
        }
        &.right {
          right: -100px;
        }
      }
    }
    .playlist-list {
      .playlist-item {
        position: relative;
        transition: all 0.3s ease-in-out;
        &:hover {
          transform: scale(1.1);
        }
        .paly-icon {
          display: flex;
          align-items: center;
          font-weight: 700;
          position: absolute;
          top: 10px;
          left: 20px;
          color: #fff;
          z-index: 2;
          .icon {
            width: 24px;
            height: 24px;
            margin-right: 5px;
          }
          .play-count {
            font-size: 22px;
          }
        }
        .img-container {
          position: relative;
          width: 220px;
          height: 220px;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
          .playlist-img {
            width: 100%;
            height: 100%;
            border-radius: 10px;
            display: block;
          }
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
        .playlist-info {
          width: 220px;
          min-height: 48px;
          display: flex;
          flex-direction: column;
          .name,
          .desc {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .name {
            font-weight: 500;
            margin-bottom: 4px;
          }
          .desc {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
  }
  .top-picks {
    width: 100%;
    padding-top: 20px;
    .picks-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .picks-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      .picks-item {
        padding: 20px;
        background-color: #fcfcfc;
        border-radius: 10px;
        transition: all 0.3s ease-in-out;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        &:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .picks-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          .picks-name {
            font-size: 20px;
            font-weight: 600;
          }
          .picks-frequency {
            font-size: 14px;
            color: #999;
          }
        }
        .picks-content {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          .picks-img {
            width: 100px;
            height: 100px;
            border-radius: 10px;
            overflow: hidden;
            margin-right: 20px;
          }
          .picks-tracks {
            flex: 1;
            .track-item {
              font-size: 14px;
              color: #999;
              margin-bottom: 4px;
              width: 227px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .track-item:nth-child(1) {
              font-weight: 600;
            }
          }
        }
      }
    }
  }
  .new-music {
    width: 100%;
    padding-top: 20px;
    .new-music-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .new-music-carousel {
      position: relative;
      // overflow: hidden;
      .new-music-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .carousel-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 50px;
        height: 80px;
        background-color: #e5e3e3;
        color: #333;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        z-index: 10;
        transition: background-color 0.3s;
        &.left {
          left: -100px;
        }
        &.right {
          right: -100px;
        }
      }
      .new-music-item {
        width: 387px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 20px;
        background-color: #fcfcfc;
        border-radius: 10px;
        transition: all 0.3s ease-in-out;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        &:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .new-music-img {
          width: 60px;
          height: 60px;
          margin-right: 20px;
          flex-shrink: 0;
          .music-img {
            width: 60px;
            height: 60px;
            border-radius: 10px;
          }
        }
        .new-music-info {
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
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(-20px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-20px);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(20px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(20px);
}
</style>
