<script setup>
import TableComponent from '@/components/TableComponent.vue'

import { computed } from 'vue'

const orders = 'orders'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
const ordersPin = 'oblast'
const params = computed(() => ({
  dateFrom: '2024-07-01',
  dateTo: '2025-07-03',
  page: 1,
  key: API_KEY,
  limit: 100,
}))
</script>

<template lang="pug">
section.orders
  TableComponent.orders__table(:input='params', :collection='orders', :pin='ordersPin')
</template>

<style scoped lang="scss">
.orders {
  width: 100%;
}
</style>
