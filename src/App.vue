<script setup>
import LoginDialog from '@/components/LoginDialog.vue'
import { useDialogStore } from '@/stores/dialog'
import PlayerIndex from '@/components/PlayerIndex.vue'
const dialogStore = useDialogStore()
</script>

<template>
  <div class="app">
    <router-view></router-view>
    <PlayerIndex></PlayerIndex>
    <LoginDialog v-if="dialogStore.loginDialogVisible"></LoginDialog>
  </div>
</template>

<style scoped></style>
