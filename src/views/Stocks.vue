<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import TableComponent from '@/components/TableComponent.vue'

// Функция получения вчерашней даты в формате YYYY-MM-DD
// Возвращает строку с датой для использования в API запросах
const getYesterday = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Реактивная переменная для хранения даты запроса остатков
const date = ref('')
date.value = getYesterday()

// Название коллекции данных для API запросов остатков на складах
const stocks = 'stocks'
// Поле для группировки данных в круговой диаграмме (по названию склада)
const stocksPin = 'warehouse_name'

// API ключ для авторизации запросов к серверу
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
// Вычисляемое свойство с параметрами для API запроса остатков
// Содержит дату, пагинацию и ключ авторизации
const params = computed(() => ({
  dateFrom: date.value,  // Дата для загрузки данных об остатках
  dateTo: '',            // Конечная дата не используется для остатков
  page: 1,               // Номер страницы для пагинации
  key: API_KEY,          // API ключ для авторизации
  limit: 100,            // Лимит записей на страницу
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
