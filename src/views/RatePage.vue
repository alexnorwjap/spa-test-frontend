<script setup>
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainData'
import { onMounted, computed } from 'vue'
// import { count } from 'echarts/types/src/component/dataZoom/history.js'
import { Top, Bottom, SemiSelect, Loading } from '@element-plus/icons-vue'
import MainPieComponent from '@/components/MainPieComponent.vue'
import PeriodSelector from '@/components/PeriodSelector.vue'
import RatePageFilter from '@/components/RatePageFilter.vue'

// Подключение к главному хранилищу данных приложения
const store = useMainStore()
// Объект маршрутизатора для навигации между страницами
const route = useRouter()
// Название метрики из query параметров URL для анализа данных
const nameRate = route.currentRoute.value.query.name

// Вычисляемое свойство для получения данных по артикулам для выбранной метрики
// Группирует данные по артикулам для указанной категории анализа
const pricesByArticle = computed(() => store.combineDataByArticle(nameRate))

// Конфигурация колонок для таблицы с данными рейтинга
const columns = [
  { prop: 'nm_id', label: 'Артикул', width: '180' },
  { prop: 'mainSum', label: 'Текущий период', width: '150' },
  { prop: 'prevSum', label: 'Предыдущий период', width: '150' },
  { prop: 'difference', label: 'Изменение (%)', width: '120' },
]

// Функция получения иконки и цвета для отображения изменений показателей
// Возвращает соответствующую иконку и цвет в зависимости от направления изменения
const getChangeIcon = (difference) => {
  if (difference.startsWith('+')) {
    return { icon: Top, color: '#67C23A' }     // Зеленый цвет для положительных изменений
  } else if (difference.startsWith('-')) {
    return { icon: Bottom, color: '#F56C6C' }  // Красный цвет для отрицательных изменений
  } else {
    return { icon: SemiSelect, color: '#909399' } // Серый цвет для отсутствия изменений
  }
}

// Функция обработки клика по строке таблицы
// Переходит на страницу детальной информации об артикуле
const handleRowClick = (row) => {
  console.log('🎯 Клик по строке:', row)
  route.push({
    path: `/article/${row.nm_id}`,
  })
}

// Хук монтирования компонента
// Инициализирует страницу: загружает данные если их нет, выводит отладочную информацию
onMounted(async () => {
  if (!store.mainData.length) {
    await store.fetchData()
  }
  console.log(store.pieDataMain)
  console.log(pricesByArticle.value)
  console.log(store.mainData)
})
</script>

<template lang="pug">
// Лоадер
.loading-container(v-if='store.loading')
  .loading-content
    el-icon.loading-icon(size='48')
      Loading
    p.loading-text Загрузка данных...

section.rate(v-else-if='!store.error && store.mainData.length > 0')
  // Селектор периодов
  PeriodSelector

  // Фильтры
  RatePageFilter(:current-page-data='pricesByArticle')

  h2.rate__title Data {{ nameRate }}
  el-table.rate__table(
    :data='pricesByArticle',
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
      :prop='column.prop',
      :label='column.label',
      sortable,
      show-overflow-tooltip
    )
      template(v-if='column.prop === "difference"', #default='{ row }')
        .change-cell(:style='{ color: getChangeIcon(row.difference).color }')
          el-icon.change-icon
            component(:is='getChangeIcon(row.difference).icon')
          span.change-text {{ row.difference }}
  .pie-container
    MainPieComponent.pie(
      :key='nameRate',
      :data='store.pieDataNew[nameRate].map((item) => ({ name: item.nm_id, value: item.mainSum }))',
      :title='nameRate',
      :pin='nameRate'
    )
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

.rate {
  &__title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  &__table {
    max-width: 1200px;
    margin-bottom: 20px;
  }
}

.pie-container {
  max-width: 1200px;
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

.change-cell {
  display: flex;
  align-items: center;
  gap: 14px;

  .change-icon {
    font-size: 14px;
  }

  .change-text {
    font-weight: 500;
  }
}
</style>
