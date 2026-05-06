import request from '@/utils/request'
export const getRecommendedPlaylist = () => {
  return request.get('/personalized', {
    params: {
      limit: 25,
    },
  })
}
// 获取精选榜单信息
export const getRankinglist = () => {
  return request.get('/toplist/detail')
}

// 获取新歌推荐列表
export const getNewMusic = () => {
  return request.get('/top/song', {
    params: {
      type: 0,
    },
  })
}

export const getPlaylistDetail = (id) => {
  return request.get(`/playlist/detail`, { params: { id } })
}
export const isUserCollectPlaylist = (t, id) => {
  return request.get(`/playlist/subscribe`, { params: { t, id } })
}
// 获取歌曲详情
export const getMusicDetail = (id) => {
  return request.get(`/song/detail`, { params: { ids: id } })
}
// 获取逐字歌词
export const getLiteralLyrics = (id) => {
  return request.get(`/lyric/new`, { params: { id } })
}
// 获取歌曲音频
export const getMusicAudio = (id) => {
  return request.get(`/song/url`, { params: { id } })
}
// 获取歌手详情
export const getSingerDetail = (id) => {
  return request.get(`/artist/detail`, { params: { id } })
}
// 获取歌手歌曲列表
export const getSingerMusicList = (id) => {
  return request.get(`/artist/top/song`, { params: { id } })
}
// 获取搜索结果
export const getSearchResult = (query) => {
  return request.get(`/cloudsearch`, { params: { ...query } })
}
