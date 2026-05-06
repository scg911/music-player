// src/stores/dialog.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDialogStore = defineStore('dialog', () => {
  const loginDialogVisible = ref(false)

  const openLoginDialog = () => {
    loginDialogVisible.value = true
  }

  const closeLoginDialog = () => {
    loginDialogVisible.value = false
  }

  return {
    loginDialogVisible,
    openLoginDialog,
    closeLoginDialog,
  }
})
