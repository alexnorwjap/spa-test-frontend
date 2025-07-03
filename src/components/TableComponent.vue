<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import PieComponent from '@/components/PieComponent.vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import axios from 'axios'
const props = defineProps({
  input: Object,
  collection: String,
  pin: String,
})

const API_BASE_URL = 'http://109.73.206.144:6969/api'

const tableData = ref([])
const paginationData = ref()
const pieData = ref()
const currentColumnIndex = ref(2)
const loading = ref(false)
const error = ref(null)

const columns = computed(() => {
  if (tableData.value.length === 0) {
    return []
  }
  return Object.keys(tableData.value[0])
})

function countObjectsByKey(array, key) {
  const counts = array
    .filter((obj) => obj[key] !== undefined && obj[key] !== null)
    .reduce((acc, obj) => {
      const value = obj[key]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }))
}

const navigateToPreviousColumn = () => {
  if (columns.value.length === 0) return

  currentColumnIndex.value =
    (currentColumnIndex.value - 1 + columns.value.length) % columns.value.length
  updatePieDataWithCurrentColumn()
}

const navigateToNextColumn = () => {
  if (columns.value.length === 0) return

  currentColumnIndex.value = (currentColumnIndex.value + 1) % columns.value.length
  updatePieDataWithCurrentColumn()
}

const updatePieDataWithCurrentColumn = () => {
  if (columns.value.length === 0 || tableData.value.length === 0) return

  const currentColumn = columns.value[currentColumnIndex.value]
  pieData.value = countObjectsByKey(tableData.value, currentColumn)
}

const fetchStocks = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await axios.get(`${API_BASE_URL}/${props.collection}`, {
      params: props.input,
    })
    paginationData.value = response.data.meta.total
    tableData.value = response.data.data
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Произошла ошибка'
    console.error('Ошибка при загрузке данных:', err)
  } finally {
    loading.value = false
  }
}

const handleCurrentChange = (currentPage) => {
  fetchStocks()
}

const refreshData = () => {
  fetchStocks()
}

onMounted(() => {
  fetchStocks()
})

watch(
  tableData,
  (newTableData) => {
    if (columns.value.length > 0 && newTableData.length > 0) {
      if (currentColumnIndex.value >= columns.value.length) {
        currentColumnIndex.value = 0
      }
      const currentColumn = columns.value[currentColumnIndex.value]
      pieData.value = countObjectsByKey(newTableData, currentColumn)
    }
  },
  { immediate: true },
)
</script>

<template lang="pug">
.wrapp
  .table(v-loading='loading', element-loading-text='Loading...')
    .table__header
      h1.table__title(size='large') {{ props.collection[0].toUpperCase() + props.collection.slice(1) }}
      el-button(v-if='!loading && !error', @click='refreshData') Обновить
    .table__content(
      v-if='!error && tableData.length > 0',
      :class='{ "table__content--visible": !loading && tableData.length > 0 }'
    )
      el-table(
        :data='tableData',
        :table-layout='"fixed"',
        style='width: 100%',
        max-height='400',
        :border='true',
        highlight-current-row
      )
        el-table-column(
          v-for='(column, index) in columns',
          :prop='column',
          :label='column',
          :key='index',
          sortable,
          width='180',
          show-overflow-tooltip
        )
    .table__empty(
      v-if='error || (tableData.length === 0 && !loading)',
      :class='{ "table__empty--visible": error || (tableData.length === 0 && !loading) }'
    )
      el-empty(:description='error || "Нет данных"')
        el-button(type='danger', @click='refreshData') Попробовать еще раз
    el-pagination.table__pagination(
      :background='true',
      layout='prev, pager, next',
      :total='paginationData',
      v-model:page-size='props.input.limit',
      v-model:current-page='props.input.page',
      @current-change='handleCurrentChange'
    )
  .pie-container
    el-button(type='default', :icon='ArrowLeft', @click='navigateToPreviousColumn') Предыдущая колонка
    PieComponent.pie(
      :data='pieData',
      :title='columns[currentColumnIndex]',
      v-if='!loading && !error && columns.length > 0 && tableData.length > 0',
      :pin='columns[currentColumnIndex]'
    )
    el-button(type='default', @click='navigateToNextColumn')
      | Следующая колонка
      el-icon.el-icon--right
        component(:is='ArrowRight')
</template>

<style scoped lang="scss">
.wrapp {
}
.pie-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;

  .pie {
    flex: 1 1 100%;
    min-width: 500px;
    padding: 20px;
  }

  .el-button {
    flex: 0 0 auto;
    height: fit-content;
    margin: 0 10px;
    white-space: nowrap;
  }
}

.table {
  width: 100%;
  padding: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: auto;

  min-height: 200px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  &__title {
    color: var(--el-text-color-regular);
    margin-bottom: 20px;
    font-size: 36px;
  }

  &__content {
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;

    &--visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__empty {
    opacity: 0;
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &--visible {
      opacity: 1;
    }
  }
}
</style>
