import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMusicAudio } from '@/api/music'

export const usePlayerStore = defineStore(
  'player-data',
  () => {
    const isPlaying = ref(false)
    const currentSong = ref({})
    const playList = ref([])
    const currentIndex = ref(0)
    const playMode = ref('order')
    const currentTime = ref(0)
    const duration = ref(0)

    const audio = new Audio()

    // 播放歌曲（直接使用已有的完整信息）
    async function playSong(song) {
      currentSong.value = song
      isPlaying.value = true

      // 获取音频URL
      const audioRes = await getMusicAudio(song.id)
      audio.src = audioRes.data[0].url
      audio.play()

      // 添加到播放列表（如果不在列表中）
      const existingIndex = playList.value.findIndex((item) => item.id === song.id)
      if (existingIndex === -1) {
        playList.value.push(song)
        currentIndex.value = playList.value.length - 1
      } else {
        currentIndex.value = existingIndex
      }
    }

    // 设置完整播放列表
    function setPlayList(songs, startIndex = 0) {
      playList.value = songs
      currentIndex.value = startIndex
      if (songs.length > 0) {
        playSong(songs[startIndex])
      }
    }

    // 上一首
    async function playPrevious() {
      if (playList.value.length === 0) return

      if (playMode.value === 'random') {
        currentIndex.value = Math.floor(Math.random() * playList.value.length)
      } else {
        currentIndex.value =
          (currentIndex.value - 1 + playList.value.length) % playList.value.length
      }

      await playSong(playList.value[currentIndex.value])
    }

    // 下一首
    async function playNext() {
      if (playList.value.length === 0) return

      if (playMode.value === 'random') {
        currentIndex.value = Math.floor(Math.random() * playList.value.length)
      } else {
        currentIndex.value = (currentIndex.value + 1) % playList.value.length
      }

      await playSong(playList.value[currentIndex.value])
    }

    // 监听音频事件
    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio.currentTime * 1000
    })

    audio.addEventListener('loadedmetadata', () => {
      duration.value = audio.duration * 1000
    })

    audio.addEventListener('ended', () => {
      // 单曲循环模式：重新播放当前歌曲
      if (playMode.value === 'single') {
        audio.currentTime = 0
        audio.play()
        return
      }

      // 其他模式：播放下一首
      playNext()
    })

    // 暂停/播放
    function togglePlay() {
      if (isPlaying.value) {
        audio.pause()
      } else {
        audio.play()
      }
      isPlaying.value = !isPlaying.value
    }

    // 跳转到指定位置
    function seek(time) {
      audio.currentTime = time / 1000
      currentTime.value = time
    }

    // 切换播放模式
    function togglePlayMode() {
      const modes = ['order', 'random', 'single']
      const currentModeIndex = modes.indexOf(playMode.value)
      playMode.value = modes[(currentModeIndex + 1) % modes.length]
    }

    return {
      isPlaying,
      currentSong,
      playList,
      currentIndex,
      playMode,
      currentTime,
      duration,
      playSong,
      setPlayList,
      playPrevious,
      playNext,
      togglePlay,
      seek,
      togglePlayMode,
    }
  },
  {
    persist: true,
  },
)
