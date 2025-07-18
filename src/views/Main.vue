<script setup>
// Импорт реактивных функций Vue 3
import { ref, onMounted, computed, watch } from 'vue'
// Импорт компонентов приложения
import MainPieComponent from '@/components/MainPieComponent.vue'
import PeriodSelector from '@/components/PeriodSelector.vue'
import RatePageFilter from '@/components/RatePageFilter.vue'
// Импорт хранилища данных
import { useMainStore } from '@/stores/mainData'
// Импорт роутера для навигации
import { useRouter } from 'vue-router'
// Импорт иконок Element Plus
import { Top, Bottom, SemiSelect, Refresh, Loading } from '@element-plus/icons-vue'

// Экземпляр хранилища данных приложения
const store = useMainStore()
// Экземпляр роутера для навигации между страницами
const router = useRouter()

// Конфигурация колонок для таблиц с данными
const columns = [
  { prop: 'nm_id', label: 'Артикул', width: '180' },
  { prop: 'mainSum', label: 'Текущий период', width: '150' },
  { prop: 'prevSum', label: 'Предыдущий период', width: '150' },
  { prop: 'difference', label: 'Изменение (%)', width: '120' },
]

// Функция определения иконки и цвета для отображения изменений в процентах
// Параметр difference - строка с процентным изменением (например, "+15%", "-10%", "0%")
const getChangeIcon = (difference) => {
  if (difference.startsWith('+')) {
    return { icon: Top, color: '#67C23A' } // зеленый для роста
  } else if (difference.startsWith('-')) {
    return { icon: Bottom, color: '#F56C6C' } // красный для падения
  } else {
    return { icon: SemiSelect, color: '#909399' } // серый для отсутствия изменений
  }
}

// Вычисляемое свойство для получения топ артикулов по различным метрикам
// Возвращает массив данных, сгруппированных по артикулам для каждой категории анализа
const topArticles = computed(() => {
  const title = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']
  return title.map((item) => store.combineDataByArticle(item))
})

// Объединенные данные для компонента фильтров
// Содержит все уникальные артикулы из всех категорий для использования в фильтрах
const allArticlesData = computed(() => {
  const allData = []
  topArticles.value.forEach((categoryData) => {
    allData.push(...categoryData)
  })
  // Удаление дубликатов по nm_id
  const uniqueData = allData.filter(
    (item, index, self) => index === self.findIndex((t) => t.nm_id === item.nm_id),
  )
  return uniqueData
})

// Вычисляемое свойство для получения топ-20 элементов по изменениям в процентах для каждой категории
// Исключает элементы без изменений (0%) и сортирует по абсолютному значению изменений
const top20ByCategory = computed(() => {
  // Категории для анализа: артикулы, общая цена, процент скидки, отмены
  const title = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']

  return title.reduce((acc, category, index) => {
    // Получение данных для текущей категории
    const data = topArticles.value[index] || []

    // Фильтруем элементы без изменений (0%)
    const dataWithChanges = data.filter((item) => item.difference !== '0%')

    // Сортируем по абсолютному значению процентного изменения (по убыванию)
    const sortedData = [...dataWithChanges].sort((a, b) => {
      const aPercent = Math.abs(parseFloat(a.difference.replace(/[+%]/g, '')))
      const bPercent = Math.abs(parseFloat(b.difference.replace(/[+%]/g, '')))
      return bPercent - aPercent
    })

    // Берем только первые 20 элементов
    acc[category] = sortedData.slice(0, 20)
    return acc
  }, {})
})

// Вычисляемое свойство для генерации динамических заголовков таблиц
// Создает заголовки с указанием реального количества элементов для каждой категории
const tableHeaders = computed(() => {
  // Категории для анализа данных
  const title = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']

  return title.reduce((acc, category) => {
    // Подсчет количества элементов в текущей категории
    const dataCount = top20ByCategory.value[category]?.length || 0

    // Формирование заголовка в зависимости от количества данных
    if (dataCount === 0) {
      acc[category] = `Нет изменений: ${category}`
    } else if (dataCount <= 20) {
      acc[category] = `Топ-${dataCount} изменений: ${category}`
    } else {
      acc[category] = `Топ-20 изменений: ${category}`
    }

    return acc
  }, {})
})

// Функция обработки клика по элементу круговой диаграммы
// Параметр clickData - данные элемента диаграммы, по которому кликнули
const handleChartClick = (clickData) => {
  console.log('🎯 Клик по графику:', clickData)
  // Переход на страницу рейтинга с передачей имени элемента в query параметрах
  router.push({
    path: '/rate',
    query: {
      name: clickData.name,
    },
  })
}

// Функция обработки клика по строке таблицы
// Параметр row - данные строки таблицы, по которой кликнули
const handleRowClick = (row) => {
  console.log('🎯 Клик по строке:', row)
  // Переход на страницу детальной информации об артикуле
  router.push({
    path: `/article/${row.nm_id}`,
  })
}

// Асинхронная функция для принудительного обновления данных из API
// Вызывает загрузку данных из store и выводит отладочную информацию в консоль
const refreshData = async () => {
  await store.fetchData()
  console.log(topArticles.value)
  console.log('Top Articles:', topArticles.value)
  console.log('Top 20 by Category:', top20ByCategory.value)
  console.log('Table Headers:', tableHeaders.value)
  console.log(Object.entries(store.pieDataNew))
  console.log(Object.entries(store.pieDataMain))
}

// Хук жизненного цикла компонента - выполняется после монтирования
onMounted(async () => {
  // Загружаем данные только если их нет в store (избегаем повторных запросов)
  if (!store.mainData.length) {
    await refreshData()
  }
})
</script>

<template lang="pug">
// Лоадер
.loading-container(v-if='store.loading')
  .loading-content
    el-icon.loading-icon(size='48')
      Loading
    p.loading-text Загрузка данных...

.main-container(v-else-if='!store.error && store.mainData.length > 0')
  // Селектор периодов и кнопка обновления
  .header-controls
    PeriodSelector
    el-button.refresh-btn(
      type='primary',
      :icon='Refresh',
      :loading='store.loading',
      @click='refreshData'
    ) Обновить данные

  // Фильтры
  RatePageFilter(:current-page-data='allArticlesData')

  // Графики
  .pie-container
    MainPieComponent.pie(
      v-for='[key, data] in Object.entries(store.pieDataNew)',
      :key='key',
      :data='data.map((item) => ({ name: item.nm_id, value: item.mainSum }))',
      :title='key',
      :pin='key',
      @chart-click='handleChartClick'
    )

  // Таблицы топ-20
  .tables-container
    .table-section(
      v-for='[category, data] in Object.entries(top20ByCategory)',
      :key='category',
      v-show='data.length > 0'
    )
      h3.table-title {{ tableHeaders[category] }}
      el-table.top-table(
        :data='data',
        :table-layout='"fixed"',
        style='width: 100%',
        max-height='400',
        :border='true',
        highlight-current-row,
        :default-sort='{ prop: "difference", order: "ascending" }',
        @row-click='handleRowClick'
      )
        el-table-column(
          v-for='column in columns',
          :key='column.prop',
          :prop='column.prop',
          :label='column.label',
          sortable,
          :width='column.width',
          show-overflow-tooltip
        )
          template(v-if='column.prop === "difference"', #default='{ row }')
            .change-cell(:style='{ color: getChangeIcon(row.difference).color }')
              el-icon.change-icon
                component(:is='getChangeIcon(row.difference).icon')
              span.change-text {{ row.difference }}
</template>

<style scoped lang="scss">
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  width: 100%;

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .loading-icon {
      color: #409eff;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      font-size: 16px;
      color: #606266;
      margin: 0;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  gap: 20px;

  .refresh-btn {
    flex-shrink: 0;
    height: 40px;
    padding: 0 20px;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;

    .refresh-btn {
      width: 100%;
    }
  }
}

.pie-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;

  & .pie {
    flex: 1 1 25%;
    width: 300px;
    padding: 0 10px;
  }
}

.tables-container {
  width: 100%;
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;

  .table-section {
    width: 49%;
    flex: 0 0 auto;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      flex: 0 0 100%;
    }

    .table-title {
      font-size: 18px;
      margin-bottom: 15px;
      color: #333;
      text-align: center;
    }

    .top-table {
      width: 100%;
      margin-bottom: 20px;
    }
  }
}

.change-cell {
  display: flex;
  align-items: center;
  gap: 4px;

  .change-icon {
    font-size: 14px;
  }

  .change-text {
    font-weight: 500;
  }
}
</style>
