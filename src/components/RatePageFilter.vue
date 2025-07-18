<script setup>
import { ref, watch, computed } from 'vue'
import { useMainStore } from '@/stores/mainData'

// Входные параметры компонента
const props = defineProps({
  currentPageData: {
    // Данные текущей страницы для фильтрации
    type: Array,
    default: () => [],
  },
})

// Подключение к главному хранилищу данных приложения
const store = useMainStore()

// Локальное состояние фильтров для мгновенного обновления интерфейса
// Содержит массивы для множественного выбора и строки для одиночного выбора
const localFilters = ref({
  articles: store.filters.articles || [], // Массив выбранных артикулов
  region: store.filters.region || '', // Выбранный регион
  brand: store.filters.brand || '', // Выбранный бренд
})

// Отслеживание изменений фильтров в store и синхронизация с локальным состоянием
// Обеспечивает актуальность данных при изменениях из других компонентов
watch(
  () => store.filters,
  (newFilters) => {
    localFilters.value = {
      articles: newFilters.articles || [],
      region: newFilters.region || '',
      brand: newFilters.brand || '',
    }
  },
  { deep: true },
)

// Вспомогательная функция для получения отфильтрованных данных на основе выбранных артикулов
// Используется для подсчета количества элементов в других фильтрах
const getFilteredDataForCounts = computed(() => {
  if (!localFilters.value.articles || localFilters.value.articles.length === 0) {
    return store.mainData
  }

  // Фильтруем только по выбранным артикулам
  return store.mainData.filter((item) => {
    return (
      localFilters.value.articles.includes(item.nm_id) ||
      localFilters.value.articles.includes(String(item.nm_id))
    )
  })
})

// Получение уникальных значений из исходных данных store для динамических опций
// Не фильтруется, чтобы избежать циклической зависимости
const availableArticles = computed(() => {
  const articles = new Set()

  // Получаем артикулы из данных текущей страницы
  props.currentPageData.forEach((item) => {
    if (item.nm_id) {
      articles.add(item.nm_id)
    }
  })

  // Также получаем артикулы из исходных данных store для показа всех доступных опций
  store.mainData.forEach((item) => {
    if (item.nm_id) {
      articles.add(item.nm_id)
    }
  })

  return Array.from(articles)
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((article) => ({
      value: article,
      label: String(article),
    }))
})

// Вычисляемое свойство для получения доступных регионов с подсчетом количества
// Показывает все регионы из исходных данных с количеством записей после фильтрации по артикулам
const availableRegions = computed(() => {
  const regions = new Set()
  const regionCounts = new Map()

  // Получаем регионы из исходных данных store для показа всех доступных опций
  store.mainData.forEach((item) => {
    if (item.oblast) {
      regions.add(item.oblast)
    }
  })

  // Подсчитываем количество на основе отфильтрованных данных (когда выбраны артикулы)
  const filteredData = getFilteredDataForCounts.value
  filteredData.forEach((item) => {
    if (item.oblast) {
      regionCounts.set(item.oblast, (regionCounts.get(item.oblast) || 0) + 1)
    }
  })

  return Array.from(regions)
    .sort()
    .map((region) => {
      const count = regionCounts.get(region) || 0
      return {
        value: region,
        label: `${region} (${count})`,
      }
    })
})

// Вычисляемое свойство для получения доступных брендов с подсчетом количества
// Показывает все бренды из исходных данных с количеством записей после фильтрации по артикулам
const availableBrands = computed(() => {
  const brands = new Set()
  const brandCounts = new Map()

  // Получаем бренды из исходных данных store для показа всех доступных опций
  store.mainData.forEach((item) => {
    if (item.supplier_article) {
      brands.add(item.supplier_article)
    }
  })

  // Подсчитываем количество на основе отфильтрованных данных (когда выбраны артикулы)
  const filteredData = getFilteredDataForCounts.value
  filteredData.forEach((item) => {
    if (item.supplier_article) {
      brandCounts.set(item.supplier_article, (brandCounts.get(item.supplier_article) || 0) + 1)
    }
  })

  return Array.from(brands)
    .sort()
    .map((brand) => {
      const count = brandCounts.get(brand) || 0
      return {
        value: brand,
        label: `${brand} (${count})`,
      }
    })
})


// Функция обновления конкретного фильтра
// filterType - тип фильтра (articles, region, brand)
// value - новое значение фильтра (массив для множественного выбора, строка для одиночного)
const updateFilter = (filterType, value) => {
  const newFilters = {
    [filterType]: value || (filterType === 'articles' ? [] : ''),
  }
  store.updateFilters(newFilters)
}

// Функция очистки всех фильтров
// Сбрасывает все фильтры в пустые значения как в store, так и в локальном состоянии
const clearAllFilters = () => {
  store.clearFilters()
  localFilters.value = {
    articles: [],
    region: '',
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
      label.filter-label Артикул (мультивыбор):
      el-select(
        v-model='localFilters.articles',
        placeholder='Выберите артикулы',
        size='small',
        multiple,
        clearable,
        filterable,
        @change='updateFilter("articles", $event)'
      )
        el-option(
          v-for='article in availableArticles',
          :key='article.value',
          :label='article.label',
          :value='article.value'
        )


    .filter-item
      label.filter-label Регион:
      el-select(
        v-model='localFilters.region',
        placeholder='Выберите регион',
        size='small',
        clearable,
        filterable,
        @change='updateFilter("region", $event)'
      )
        el-option(
          v-for='region in availableRegions',
          :key='region.value',
          :label='region.label',
          :value='region.value'
        )

    .filter-item
      label.filter-label Бренд:
      el-select(
        v-model='localFilters.brand',
        placeholder='Выберите бренд',
        size='small',
        clearable,
        filterable,
        @change='updateFilter("brand", $event)'
      )
        el-option(
          v-for='brand in availableBrands',
          :key='brand.value',
          :label='brand.label',
          :value='brand.value'
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
