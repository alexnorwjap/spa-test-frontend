<script setup>
import TableComponent from '@/components/TableComponent.vue'

import { computed } from 'vue'
// Название коллекции данных для API запросов поступлений товаров
const incomes = 'incomes'
// API ключ для авторизации запросов к серверу
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
// Поле для группировки данных в круговой диаграмме (по названию склада)
const incomesPin = 'warehouse_name'

// Вычисляемое свойство с параметрами для API запроса поступлений
// Содержит период дат, пагинацию и ключ авторизации
const params = computed(() => ({
  dateFrom: '2024-07-01',  // Дата начала периода для загрузки данных
  dateTo: '2025-07-03',    // Дата окончания периода для загрузки данных
  page: 1,                 // Номер страницы для пагинации
  key: API_KEY,            // API ключ для авторизации
  limit: 100,              // Лимит записей на страницу
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
