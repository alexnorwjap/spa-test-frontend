<script setup>
import TableComponent from '@/components/TableComponent.vue'

import { computed } from 'vue'
const sales = 'sales'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
const salesPin = 'region_name'
const params = computed(() => ({
  dateFrom: '2024-07-01',
  dateTo: '2025-07-03',
  page: 1,
  key: API_KEY,
  limit: 100,
}))
</script>

<template lang="pug">
section.sales
  TableComponent.sales__table(:input='params', :collection='sales', :pin='salesPin')
</template>

<style scoped lang="scss">
.sales {
  width: 100%;
}
</style>
