<script setup>
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainData'
import { onMounted, computed } from 'vue'
// import { count } from 'echarts/types/src/component/dataZoom/history.js'
import { Top, Bottom, SemiSelect } from '@element-plus/icons-vue'
import MainPieComponent from '@/components/MainPieComponent.vue'

const store = useMainStore()
const route = useRouter()
const nameRate = route.currentRoute.value.query.name

const pricesByArticle = store.combineDataByArticle(nameRate)

const columns = [
  { prop: 'nm_id', label: 'Артикул', width: '180' },
  { prop: 'mainSum', label: 'Текущий период', width: '150' },
  { prop: 'prevSum', label: 'Предыдущий период', width: '150' },
  { prop: 'difference', label: 'Изменение (%)', width: '120' },
]

// Функция для определения иконки и цвета
const getChangeIcon = (difference) => {
  if (difference.startsWith('+')) {
    return { icon: Top, color: '#67C23A' } // зеленый для роста
  } else if (difference.startsWith('-')) {
    return { icon: Bottom, color: '#F56C6C' } // красный для падения
  } else {
    return { icon: SemiSelect, color: '#909399' } // серый для отсутствия изменений
  }
}

onMounted(async () => {
  console.log(store.pieDataMain)
  console.log(pricesByArticle)
  console.log(store.mainData)
})
</script>

<template lang="pug">
section.rate
  h2.rate__title Data {{ nameRate }}
  el-table.rate__table(
    :data='pricesByArticle',
    :table-layout='"fixed"',
    style='width: 100%',
    max-height='400',
    :border='true',
    highlight-current-row,
    :default-sort='{ prop: "difference", order: "ascending" }'
  )
    el-table-column(
      v-for='column in columns',
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
  .pie-container(v-if='!store.loading && !store.error && store.mainData.length > 0')
    MainPieComponent.pie(
      :key='nameRate',
      :data='store.pieDataNew[nameRate].map((item) => ({ name: item.nm_id, value: item.mainSum }))',
      :title='nameRate',
      :pin='nameRate'
    )
</template>

<style scoped lang="scss">
.rate {
  &__title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  &__table {
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
