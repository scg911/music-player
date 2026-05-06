import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      component: () => import('../views/LayoutPage.vue'),
      redirect: '/home',
      children: [
        {
          path: '/home',
          component: () => import('../components/HomeIndex.vue'),
        },
        {
          path: '/myMusic',
          component: () => import('../components/MyMusic.vue'),
        },
        {
          path: '/playlist',
          component: () => import('../components/MusicList.vue'),
        },
        {
          path: '/search',
          component: () => import('../components/SearchMusic.vue'),
        },
        {
          path: '/singer',
          component: () => import('../components/SingerIndex.vue'),
        },
      ],
    },
    {
      path: '/play',
      component: () => import('../views/MusicPlayer.vue'),
    },
  ],
})

export default router
