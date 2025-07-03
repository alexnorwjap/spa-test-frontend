<script setup>
import TableComponent from '@/components/TableComponent.vue'

import { computed } from 'vue'
const incomes = 'incomes'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
const incomesPin = 'warehouse_name'

const params = computed(() => ({
  dateFrom: '2024-07-01',
  dateTo: '2025-07-03',
  page: 1,
  key: API_KEY,
  limit: 100,
}))
</script>

<template lang="pug">
section.incomes
  TableComponent.incomes__table(:input='params', :collection='incomes')
</template>

<style scoped lang="scss">
.incomes {
  width: 100%;
}
</style>
