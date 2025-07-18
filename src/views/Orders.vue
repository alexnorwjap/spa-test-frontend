<script setup>
import TableComponent from '@/components/TableComponent.vue'

import { computed } from 'vue'

// Название коллекции данных для API запросов заказов
const orders = 'orders'
// API ключ для авторизации запросов к серверу
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
// Поле для группировки данных в круговой диаграмме (по регионам)
const ordersPin = 'oblast'
// Вычисляемое свойство с параметрами для API запроса заказов
// Содержит период дат, пагинацию и ключ авторизации
const params = computed(() => ({
  dateFrom: '2025-07-08',  // Дата начала периода для загрузки данных
  dateTo: '2025-07-12',    // Дата окончания периода для загрузки данных
  page: 1,                 // Номер страницы для пагинации
  key: API_KEY,            // API ключ для авторизации
  limit: 100,              // Лимит записей на страницу
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
