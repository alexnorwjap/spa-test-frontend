<script setup>
import { ref, watch } from 'vue'
import { useMainStore } from '@/stores/mainData'

// Подключение к главному хранилищу данных приложения
const store = useMainStore()

// Локальное состояние фильтров для мгновенного обновления интерфейса
// Содержит текущие значения всех фильтров: артикул, регион, категория, бренд
const localFilters = ref({
  article: store.filters.article,    // Фильтр по артикулу товара
  region: store.filters.region,      // Фильтр по региону продаж
  category: store.filters.category,  // Фильтр по категории товара
  brand: store.filters.brand,        // Фильтр по бренду товара
})

// Отслеживание изменений фильтров в store и синхронизация с локальным состоянием
// Обеспечивает актуальность данных при изменениях из других компонентов
watch(
  () => store.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters }
  },
  { deep: true },
)

// Функция обновления конкретного фильтра
// filterType - тип фильтра (article, region, category, brand)
// value - новое значение фильтра
const updateFilter = (filterType, value) => {
  const newFilters = { [filterType]: value || '' }
  store.updateFilters(newFilters)
}

// Функция очистки всех фильтров
// Сбрасывает все фильтры в пустые строки как в store, так и в локальном состоянии
const clearAllFilters = () => {
  store.clearFilters()
  localFilters.value = {
    article: '',
    region: '',
    category: '',
    brand: '',
  }
}
</script>

<template lang="pug">
.filter-container
  .filter-header
    h3.filter-title Фильтры
    el-button(@click='clearAllFilters', size='small', type='info') Очистить все

  .filter-row
    .filter-item
      label.filter-label Артикул:
      el-input(
        v-model='localFilters.article',
        placeholder='Поиск по артикулу',
        size='small',
        clearable,
        @input='updateFilter("article", $event)'
      )

    .filter-item
      label.filter-label Регион:
      el-input(
        v-model='localFilters.region',
        placeholder='Поиск по региону',
        size='small',
        clearable,
        @input='updateFilter("region", $event)'
      )

    .filter-item
      label.filter-label Категория:
      el-select(
        v-model='localFilters.category',
        placeholder='Выберите категорию',
        size='small',
        clearable,
        @change='updateFilter("category", $event)'
      )
        el-option(label='Количество покупок', value='nm_id')
        el-option(label='Сумма продаж', value='total_price')
        el-option(label='Средний процент скидки', value='discount_percent')
        el-option(label='Количество отмененных заказов', value='is_cancel')

    .filter-item
      label.filter-label Бренд:
      el-input(
        v-model='localFilters.brand',
        placeholder='Поиск по бренду',
        size='small',
        clearable,
        @input='updateFilter("brand", $event)'
      )
</template>

<style scoped lang="scss">
.filter-container {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .filter-title {
    font-size: 18px;
    color: #333;
    margin: 0;
  }
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .filter-label {
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }
}
</style>
