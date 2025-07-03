<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import TableComponent from '@/components/TableComponent.vue'

const getYesterday = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const date = ref('')
date.value = getYesterday()

const stocks = 'stocks'
const stocksPin = 'warehouse_name'

const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
const params = computed(() => ({
  dateFrom: date.value,
  dateTo: '',
  page: 1,
  key: API_KEY,
  limit: 100,
}))
</script>

<template lang="pug">
section.stocks
  TableComponent.stocks__table(:input='params', :collection='stocks', :pin='stocksPin')
</template>

<style scoped lang="scss">
.stocks {
  width: 100%;
}
</style>
