<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainPieComponent from '@/components/MainPieComponent.vue'
import { useMainStore } from '@/stores/mainData'
import { useRouter } from 'vue-router'
import { Top, Bottom, SemiSelect } from '@element-plus/icons-vue'

const store = useMainStore()
const router = useRouter()

const columns = [
  { prop: 'nm_id', label: 'Артикул', width: '180' },
  { prop: 'mainSum', label: 'Текущий период', width: '150' },
  { prop: 'prevSum', label: 'Предыдущий период', width: '150' },
  { prop: 'difference', label: 'Изменение (%)', width: '120' },
]

const getChangeIcon = (difference) => {
  if (difference.startsWith('+')) {
    return { icon: Top, color: '#67C23A' } // зеленый для роста
  } else if (difference.startsWith('-')) {
    return { icon: Bottom, color: '#F56C6C' } // красный для падения
  } else {
    return { icon: SemiSelect, color: '#909399' } // серый для отсутствия изменений
  }
}

const topArticles = computed(() => {
  const title = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']
  return title.map((item) => store.combineDataByArticle(item))
})

// Топ-20 элементов по изменениям в процентах для каждой категории (исключая без изменений)
const top20ByCategory = computed(() => {
  const title = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']

  return title.reduce((acc, category, index) => {
    const data = topArticles.value[index] || []

    // Фильтруем элементы без изменений (0%)
    const dataWithChanges = data.filter((item) => item.difference !== '0%')

    // Сортируем по абсолютному значению процентного изменения (по убыванию)
    const sortedData = [...dataWithChanges].sort((a, b) => {
      const aPercent = Math.abs(parseFloat(a.difference.replace(/[+%]/g, '')))
      const bPercent = Math.abs(parseFloat(b.difference.replace(/[+%]/g, '')))
      return bPercent - aPercent
    })

    acc[category] = sortedData.slice(0, 20)
    return acc
  }, {})
})

// Динамические заголовки таблиц с реальным количеством элементов
const tableHeaders = computed(() => {
  const title = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']

  return title.reduce((acc, category) => {
    const dataCount = top20ByCategory.value[category]?.length || 0

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

const handleChartClick = (clickData) => {
  console.log('🎯 Клик по графику:', clickData)
  router.push({
    path: '/rate',
    query: {
      name: clickData.name,
    },
  })
}

onMounted(async () => {
  await store.fetchData()
  console.log(topArticles.value)
  console.log('Top Articles:', topArticles.value)
  console.log('Top 20 by Category:', top20ByCategory.value)
  console.log('Table Headers:', tableHeaders.value)
  console.log(Object.entries(store.pieDataNew))
  console.log(Object.entries(store.pieDataMain))
})
</script>

<template lang="pug">
.main-container(v-if='!store.loading && !store.error && store.mainData.length > 0')
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
        :default-sort='{ prop: "difference", order: "ascending" }'
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
.main-container {
  max-width: 1200px;
  margin: 0 auto;
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
