<script setup>
import { getSearchResult } from '@/api/music'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useRouter } from 'vue-router'
const router = useRouter()
const playerStore = usePlayerStore()
const route = useRoute()
const keywords = ref(route.query.searchText || '')
const searchResult = ref([])
const type = ref(1)

const changeType = (newType) => {
  type.value = newType
  getSearchResultList()
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
const getSearchResultList = async () => {
  const res = await getSearchResult({ keywords: keywords.value, type: type.value })
  if (res.code === 200) {
    if (type.value === 1) {
      searchResult.value = (res.result.songs || []).map((item) => {
        const artists = item.ar || item.artists || []
        return {
          id: item.id,
          name: item.name,
          artist: artists.map((artist) => artist.name).join('/'),
          singers: artists.map((artist) => ({
            id: artist.id,
            name: artist.name,
          })),
          duration: item.duration || item.dt || 0,
          coverImgUrl: item.al?.picUrl || '',
          album: (item.al || item.album)?.name || '',
          isVip: item.fee,
        }
      })
    } else if (type.value === 100) {
      searchResult.value = (res.result.artists || []).map((item) => ({
        id: item.id,
        name: item.name,
        albumSize: item.albumSize || 0,
        coverImgUrl: item.img1v1Url || '',
      }))
    } else if (type.value === 1000) {
      searchResult.value = (res.result.playlists || []).map((item) => ({
        id: item.id,
        name: item.name,
        coverImgUrl: item.coverImgUrl || '',
        playCount: item.playCount || 0,
        trackCount: item.trackCount || 0, //歌曲数
        creator: item.creator?.nickname || {},
      }))
    } else {
      searchResult.value = []
    }
  }
  console.log(searchResult.value)
}

const jumpPaly = (id) => {
  if (!id) return

  // 找到点击的歌曲
  const song = searchResult.value.find((item) => item.id === id)
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

const jumpPalylist = (id) => {
  if (!id) return
  router.push({ path: '/playlist', query: { id } })
}
// 跳转到歌手主页
const goToSinger = (singerId) => {
  if (!singerId) return
  router.push({ path: '/singer', query: { id: singerId } })
}
onMounted(() => {
  getSearchResultList()
})
</script>
<template>
  <div class="search-music">
    <div class="search-music-header">
      <span>{{ keywords }}</span>
    </div>
    <div class="search-navigation-bar">
      <span class="navigation-item" :class="{ active: type === 1 }" @click="changeType(1)"
        >单曲</span
      >
      <span class="navigation-item" :class="{ active: type === 100 }" @click="changeType(100)"
        >歌手</span
      >
      <span class="navigation-item" :class="{ active: type === 1000 }" @click="changeType(1000)"
        >歌单</span
      >
    </div>
    <div class="search-content">
      <div class="search-music-single" v-if="type === 1">
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
            v-for="(item, index) in searchResult"
            :key="item.id"
            class="music-item"
          >
            <div class="music-info-left">
              <div class="music-index">{{ index + 1 }}</div>
              <img class="music-cover" :src="item.coverImgUrl" alt="" />
              <div class="music-info">
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
              {{ formatDuration(item.duration) }}
            </div>
          </div>
        </div>
      </div>
      <div class="search-music-singer" v-else-if="type === 100">
        <div
          @click="goToSinger(item.id)"
          class="singer-item"
          v-for="item in searchResult"
          :key="item.id"
        >
          <img class="singer-cover" :src="item.coverImgUrl" alt="" />
          <span class="singer-name">{{ item.name }}</span>
          <span class="singer-album-size">专辑：{{ item.albumSize }}</span>
        </div>
      </div>
      <div class="search-music-playlist" v-else-if="type === 1000">
        <!-- 表头 -->
        <div class="playlist-header">
          <div class="playlist-header-left">
            <div class="playlist-header-index">序号</div>
            <div class="playlist-header-info">标题</div>
          </div>
          <div class="playlist-header-middle">
            <div class="playlist-header-count">歌曲数</div>
            <div class="playlist-header-creator">创建者</div>
          </div>
          <div class="playlist-header-right">播放量</div>
        </div>
        <div
          @click="jumpPalylist(item.id)"
          class="playlist-item"
          v-for="(item, index) in searchResult"
          :key="item.id"
        >
          <div class="playlist-info-left">
            <div class="playlist-index">{{ index + 1 }}</div>
            <img class="playlist-cover" :src="item.coverImgUrl" alt="" />
            <div class="playlist-left-info">
              <div class="playlist-name">
                {{ item.name }}
              </div>
              <div class="playlist-tag">包含《{{ keywords }}》</div>
            </div>
          </div>
          <div class="playlist-middle-info">
            <div class="playlist-count">{{ item.trackCount }}首</div>
            <div class="playlist-creator">
              {{ item.creator }}
            </div>
          </div>
          <div class="playlist-right-info">
            {{ formatPlayCount(item.playCount) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.search-music {
  width: 80%;
  margin: 0 auto;
  padding: 20px;
  .search-music-header {
    padding: 0 10px;
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 20px;
  }
  .search-navigation-bar {
    margin-bottom: 20px;
    .navigation-item {
      font-size: 18px;
      margin-right: 30px;
      cursor: pointer;
      position: relative;
      color: #777;
      &.active {
        color: #000;
      }
      &.active::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 45%;
        transform: translateX(-50%);
        width: 25px;
        height: 5px;
        background-color: #fc2828;
        border-radius: 4px;
      }
    }
  }
  .search-content {
    padding: 0 10px;
    .search-music-single {
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
            .music-header-count {
              width: 100px;
            }
            .music-header-creator {
              width: 100px;
            }
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
          }
        }
      }
    }
    .search-music-singer {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      max-width: 100%;
      justify-items: center;
      .singer-item {
        padding: 20px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 200px;
        border-radius: 5px;
        overflow: hidden;
        transition: transform 0.3s ease-in-out;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        &:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        .singer-cover {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          margin-bottom: 10px;
        }
        .singer-name {
          font-size: 18px;
          color: #333;
        }
        .singer-album-size {
          font-size: 13px;
          color: #999;
        }
      }
    }
    .search-music-playlist {
      .playlist-header {
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
        .playlist-header-left {
          display: flex;
          align-items: center;
          .playlist-header-index {
            width: 40px;
            margin-right: 12px; /* 与下面的 music-index + music-cover 宽度对齐 */
          }
          .playlist-header-info {
            width: 300px;
          }
        }
        .playlist-header-middle {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-left: 22px;
          width: 300px;
          .playlist-header-count {
            margin-right: -5px;
            width: 120px;
          }
          .playlist-header-creator {
            width: 200px;
          }
        }
        .playlist-header-right {
          width: 200px;
          text-align: right;
        }
      }
      .playlist-item {
        margin-bottom: 10px;
        width: 100%;
        height: 80px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 10px;
        border-radius: 10px;
        &:hover {
          background-color: #e5e5e5;
        }
        .playlist-info-left {
          display: flex;
          align-items: center;
          .playlist-index {
            width: 40px;
            margin-right: 12px; /* 与下面的 music-index + music-cover 宽度对齐 */
          }
          .playlist-cover {
            width: 60px;
            height: 60px;
            border-radius: 5px;
            margin-right: 12px;
          }
          .playlist-left-info {
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: left;
            .playlist-name {
              font-size: 17px;
              font-weight: 500;
            }
            .playlist-tag {
              font-size: 14px;
              color: #999;
            }
          }
        }
        .playlist-middle-info {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-left: -22px; /* 对齐到表头的中间列位置 */
          width: 300px;
          .playlist-count {
            font-size: 16px;
            color: #666;
            width: 100px;
          }
          .playlist-creator {
            font-size: 16px;
            color: #666;
            width: 200px;
          }
        }
        .playlist-right-info {
          width: 200px;
          text-align: right;
          font-size: 16px;
          color: #666;
        }
      }
    }
  }
}
</style>
