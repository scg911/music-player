<script setup>
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { userLogout } from '@/api/user'
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const dialogStore = useDialogStore()
const userStore = useUserStore()
const router = useRouter()
const searchText = ref('')
const handleSearch = (e) => {
  searchText.value = e.target.value.trim()
  if (searchText.value) {
    router.push({ path: '/search', query: { searchText: searchText.value } })
  }
}

const isShowLogout = ref(false)
const handleLogout = async () => {
  await userLogout()
  userStore.removeMannerInfo({})
}
</script>
<template>
  <div class="home-header">
    <div class="header-left">
      <img class="logo" src="../assets/imgs/logo.png" alt="" />
      <div class="left-router">
        <RouterLink to="/home" class="nav-link" :class="{ active: $route.path === '/home' }"
          >音乐馆</RouterLink
        >
        <RouterLink to="/myMusic" class="nav-link" :class="{ active: $route.path === '/myMusic' }"
          >我的音乐</RouterLink
        >
      </div>
    </div>
    <div class="header-right">
      <input
        v-model="searchText"
        @keyup.enter="handleSearch"
        class="search-input"
        type="text"
        placeholder="搜索歌曲/歌手/专辑"
      />
      <div class="user-login" v-if="userStore.mannerMsg.id">
        <img
          @click="isShowLogout = !isShowLogout"
          class="user-img"
          :src="userStore.mannerMsg.avatar"
          alt=""
        />
        <div v-if="isShowLogout" class="user-logout" @click="handleLogout">退出登录</div>
      </div>
      <div class="user-login" v-else>
        <button @click="dialogStore.openLoginDialog" class="login">登录</button>
      </div>
    </div>
  </div>
  <div class="main-content">
    <router-view></router-view>
  </div>
</template>
<style scoped lang="scss">
.home-header {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 90px;
  width: 100%;
  background-color: #242424;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-content {
  margin-top: 90px;
  margin-bottom: 80px;
  min-height: calc(100vh - 90px - 80px);
}

.home-header {
  .header-left {
    display: flex;
    justify-content: center;
    align-items: center;
    .logo {
      width: 55px;
      height: 55px;
      border-radius: 50%;
      margin-right: 20px;
    }
    .left-router {
      .nav-link {
        margin-right: 20px;
        color: #e5e5e5;
        text-decoration: none;
        font-size: 16px;
        padding: 8px 16px;
        border-radius: 18px;
        transition: all 0.2s;
        &.active {
          color: #fff;
          background: #c20c0c;
        }
        &:hover {
          color: #fff;
          background: #c20c0c;
        }
      }
    }
  }
  .header-right {
    display: flex;
    justify-content: center;
    align-items: center;
    .search-input {
      width: 200px;
      height: 30px;
      border-radius: 20px;
      border: 1px solid #fff;
      padding-left: 10px;
      font-size: 14px;
    }
    .user-login {
      position: relative;
      margin-left: 20px;
      cursor: pointer;
      .user-img {
        width: 55px;
        height: 55px;
        border-radius: 50%;
      }
      .user-logout {
        position: absolute;
        top: 70px;
        left: -12px;
        width: 80px;
        text-align: center;
        padding: 6px 0;
        border-radius: 5px;
        background: #e9e6e6;
        color: #000;
        font-size: 16px;
        &:hover {
          color: #c20c0c;
        }
      }
      .login {
        width: 100%;
        padding: 6px 14px;
        border: 1px solid #c20c0c;
        border-radius: 18px;
        background: transparent;
        color: #c20c0c;
        font-size: 16px;
        &:hover {
          background: #c20c0c;
          color: #fff;
        }
      }
    }
  }
}
</style>
