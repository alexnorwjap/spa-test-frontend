<script setup>
import HeaderComponent from '@/components/HeaderComponent.vue'
</script>

<template lang="pug">
HeaderComponent
main.page
  <RouterView />
</template>

<style scoped lang="scss">
.page {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 100px;
  align-items: flex-start;
  overflow: clip;
}
</style>
