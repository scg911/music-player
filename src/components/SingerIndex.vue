<script setup>
import { getSingerDetail, getSingerMusicList } from '@/api/music'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useRouter } from 'vue-router'
const router = useRouter()
const playerStore = usePlayerStore()

const route = useRoute()
const singerId = ref(route.query.id)

// 监听路由参数变化
watch(
  () => route.query.id,
  (newId) => {
    if (newId) {
      singerId.value = newId
      getSingerDetailData()
      getSingerMusicListData()
    }
  },
)

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
const singerDetail = ref({})
const getSingerDetailData = async () => {
  const res = await getSingerDetail(singerId.value)
  singerDetail.value = {
    // 修改后
    alias: res.data.artist.alias.join('/'),
    name: res.data.artist.name,
    avatar: res.data.artist.avatar,
  }
  // console.log(res)
}
const musicList = ref([])
const getSingerMusicListData = async () => {
  const res = await getSingerMusicList(singerId.value)
  musicList.value = res.songs?.map((item) => {
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
  // console.log(musicList.value)
}
onMounted(() => {
  getSingerDetailData()
  getSingerMusicListData()
})
const jumpPaly = (id) => {
  if (!id) return
  // 找到当前点击的歌曲
  const song = musicList.value.find((item) => item.id === id)
  const songIndex = musicList.value.findIndex((item) => item.id === id)

  if (song) {
    // 切换播放列表为当前歌单，并从点击的歌曲开始播放
    playerStore.setPlayList(musicList.value, songIndex)
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
  if (musicList.value.length === 0) return

  // 设置播放列表为当前歌单的所有歌曲，并从第一首开始播放
  playerStore.setPlayList(musicList.value, 0)
}
</script>
<template>
  <div class="singer-index">
    <div class="singer-info-header">
      <div class="singer-info-left">
        <img class="singer-img" :src="singerDetail.avatar" alt="" />
      </div>
      <div class="singer-info-right">
        <div class="singer-name">{{ singerDetail.name }}</div>
        <div class="singer-alias">{{ singerDetail.alias }}</div>
        <button class="play-all-btn" @click="playAll">
          <CaretRight style="width: 26px; height: 26px; margin-right: 5px" />播放全部
        </button>
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
        v-for="(item, index) in musicList"
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
          {{ formatDuration(item.duration) }}
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.singer-index {
  width: 80%;
  margin: 0 auto;
  .singer-info-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 20px;
    .singer-info-left {
      flex-shrink: 0;
      margin-right: 20px;
      .singer-img {
        width: 200px;
        height: 200px;
        border-radius: 50%;
      }
    }
    .singer-info-right {
      .singer-name {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .singer-alias {
        font-size: 16px;
        color: #666;
        margin-bottom: 20px;
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
        padding-left: 22px;
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
      height: 60px;
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
          width: 40px;
          height: 40px;
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
