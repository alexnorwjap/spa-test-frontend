<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import PieComponent from '@/components/PieComponent.vue'
import { ArrowLeft, ArrowRight, Operation, Finished } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRoute } from 'vue-router'

// Входные параметры компонента
const props = defineProps({
  input: Object,      // Параметры для API запроса (пагинация, фильтры)
  collection: String, // Название коллекции данных для API
  pin: String,        // Идентификатор для привязки данных
})
// Базовый URL для API запросов
const API_BASE_URL = '/api'
// Объект маршрута для доступа к параметрам URL
const route = useRoute()

// Основные данные таблицы
const tableData = ref([])           // Данные таблицы, полученные с сервера
const filteredTableData = ref([])   // Отфильтрованные данные таблицы
const paginationData = ref()        // Данные для пагинации (общее количество записей)
const pieData = ref()               // Данные для круговой диаграммы
const currentColumnIndex = ref(2)   // Индекс текущей колонки для отображения в диаграмме
const loading = ref(false)          // Состояние загрузки данных
const error = ref(null)             // Сообщение об ошибке
const tableRef = ref()              // Ссылка на компонент таблицы

// Управление состоянием фильтров
const filters = ref({})             // Активные фильтры таблицы
const availableFilters = ref({})    // Доступные опции для фильтров по каждой колонке
const lastFetchParams = ref(null)   // Последние параметры API запроса для предотвращения дублирования

// Функция загрузки фильтров из localStorage
// Восстанавливает сохраненные фильтры для конкретной коллекции данных
const loadFiltersFromStorage = () => {
  try {
    const storageKey = `table-filters-${props.collection}`
    const savedFilters = localStorage.getItem(storageKey)
    return savedFilters ? JSON.parse(savedFilters) : {}
  } catch (error) {
    console.error('Error loading filters from localStorage:', error)
    return {}
  }
}

// Функция сохранения фильтров в localStorage
// Сохраняет текущие фильтры для последующего восстановления
const saveFiltersToStorage = (filtersToSave) => {
  try {
    const storageKey = `table-filters-${props.collection}`
    localStorage.setItem(storageKey, JSON.stringify(filtersToSave))
  } catch (error) {
    console.error('Error saving filters to localStorage:', error)
  }
}

// Функция проверки изменения параметров API
// Предотвращает дублирование запросов с одинаковыми параметрами
const hasParamsChanged = (newParams) => {
  if (!lastFetchParams.value) return true
  return JSON.stringify(newParams) !== JSON.stringify(lastFetchParams.value)
}

// Вычисляемое свойство для получения названий колонок таблицы
// Извлекает ключи из первого объекта данных таблицы
const columns = computed(() => {
  if (tableData.value.length === 0) {
    return []
  }
  return Object.keys(tableData.value[0])
})

// Функция получения отфильтрованных данных на основе активных фильтров
// Применяет все активные фильтры к данным таблицы
const getFilteredData = () => {
  if (!filters.value || Object.keys(filters.value).length === 0) {
    return tableData.value
  }

  return tableData.value.filter((row) => {
    return Object.entries(filters.value).every(([columnKey, filterValues]) => {
      if (!filterValues || filterValues.length === 0) return true
      return filterValues.includes(String(row[columnKey]))
    })
  })
}

// Функция генерации доступных опций фильтров для каждой колонки
// Создает список уникальных значений для фильтрации по каждой колонке
const generateAvailableFilters = () => {
  if (tableData.value.length === 0) return

  // Используем отфильтрованные данные для генерации опций, исключая недоступные варианты
  const dataToUse = getFilteredData()

  const newAvailableFilters = {}
  columns.value.forEach((column) => {
    const uniqueValues = [
      ...new Set(
        dataToUse
          .map((row) => row[column])
          .filter((value) => value !== null && value !== undefined && value !== ''),
      ),
    ]

    newAvailableFilters[column] = uniqueValues
      .sort()
      .slice(0, 20) // Ограничиваем до 20 опций для избежания проблем с производительностью
      .map((value) => ({
        text: String(value),
        value: String(value),
      }))
  })

  availableFilters.value = newAvailableFilters
}

// Метод фильтрации для колонок таблицы
// Сравнивает значение фильтра со значением в строке таблицы
const filterHandler = (value, row, column) => {
  const property = column.property
  return String(row[property]) === String(value)
}

// Функция восстановления сохраненных фильтров в таблице
// Применяет сохраненные фильтры к компоненту таблицы после загрузки данных
const restoreFilters = async () => {
  // С помощью свойства filtered-value фильтры восстанавливаются автоматически
  // Эта функция сохранена для потенциальных будущих улучшений
  if (!tableRef.value) return

  // Ждем следующий тик, чтобы убедиться, что таблица полностью отрендерена
  await nextTick()

  // Принудительно обновляем макет таблицы при необходимости
  if (tableRef.value && tableRef.value.doLayout) {
    tableRef.value.doLayout()
  }
}

// Функция обработки событий изменения фильтров от таблицы
// Обновляет состояние фильтров при изменении пользователем
const handleFilterChange = (filtersData) => {
  // Element Plus передает данные фильтров как { columnKey: [selectedValues] }
  const filterState = {}
  Object.entries(filtersData).forEach(([columnKey, filterValues]) => {
    if (filterValues && filterValues.length > 0) {
      filterState[columnKey] = filterValues
    }
  })

  // Обновляем состояние фильтров (это запустит watcher для сохранения в localStorage)
  filters.value = filterState

  // Перегенерируем доступные фильтры на основе нового состояния фильтров
  generateAvailableFilters()
}

// Функция получения иконки фильтра для каждой колонки
// Возвращает разные иконки в зависимости от того, активен ли фильтр
const getFilterIcon = (column) => {
  return filters.value[column] && filters.value[column].length > 0 ? Finished : Operation
}

// Функция сброса фильтра конкретной колонки
// Очищает фильтр для указанной колонки и обновляет состояние
const resetColumnFilter = (columnKey) => {
  if (tableRef.value) {
    tableRef.value.clearFilter([columnKey])
  }

  // Удаляем фильтр из нашего состояния
  if (filters.value[columnKey]) {
    delete filters.value[columnKey]
    saveFiltersToStorage(filters.value)
  }

  // Перегенерируем доступные фильтры
  generateAvailableFilters()
}

// Функция сброса всех фильтров
// Очищает все активные фильтры и восстанавливает исходное состояние таблицы
const clearAllFilters = () => {
  if (tableRef.value) {
    tableRef.value.clearFilter()
  }
  filters.value = {}
  saveFiltersToStorage({})

  // Перегенерируем доступные фильтры, чтобы снова показать все опции
  generateAvailableFilters()
}

// Функция подсчета объектов по ключу
// Подсчитывает количество вхождений каждого значения в указанном поле массива объектов
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

// Функция навигации к предыдущей колонке
// Переключает отображение диаграммы на предыдущую колонку таблицы
const navigateToPreviousColumn = () => {
  if (columns.value.length === 0) return

  currentColumnIndex.value =
    (currentColumnIndex.value - 1 + columns.value.length) % columns.value.length
  updatePieDataWithCurrentColumn()
}

// Функция навигации к следующей колонке
// Переключает отображение диаграммы на следующую колонку таблицы
const navigateToNextColumn = () => {
  if (columns.value.length === 0) return

  currentColumnIndex.value = (currentColumnIndex.value + 1) % columns.value.length
  updatePieDataWithCurrentColumn()
}

// Функция обновления данных диаграммы для текущей колонки
// Генерирует данные для круговой диаграммы на основе выбранной колонки
const updatePieDataWithCurrentColumn = () => {
  if (columns.value.length === 0 || tableData.value.length === 0) return

  const currentColumn = columns.value[currentColumnIndex.value]
  pieData.value = countObjectsByKey(tableData.value, currentColumn)
  console.log(pieData.value)
}

// Функция загрузки данных с сервера
// Выполняет API запрос для получения данных таблицы с учетом параметров фильтрации и пагинации
const fetchStocks = async (forceRefresh = false) => {
  // Проверяем, нужно ли загружать данные (предотвращаем дублирующие вызовы)
  if (!forceRefresh && !hasParamsChanged(props.input)) {
    console.log('Skipping API call - params unchanged')
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await axios.get(`${API_BASE_URL}/${props.collection}`, {
      params: props.input,
    })
    paginationData.value = response.data.meta.total
    tableData.value = response.data.data
    lastFetchParams.value = { ...props.input }

    // Генерируем опции фильтров после загрузки данных
    generateAvailableFilters()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Произошла ошибка'
    console.error('Ошибка при загрузке данных:', err)
  } finally {
    loading.value = false
  }
}

// Функция обработки изменения текущей страницы пагинации
// Принудительно обновляет данные при переходе на другую страницу
const handleCurrentChange = (currentPage) => {
  fetchStocks(true) // Принудительное обновление для пагинации
}

// Функция ручного обновления данных
// Принудительно перезагружает данные по запросу пользователя
const refreshData = () => {
  fetchStocks(true) // Принудительное обновление для ручного обновления
}

// Хук монтирования компонента
// Инициализирует компонент: загружает сохраненные фильтры, получает данные с сервера
onMounted(async () => {
  // Загружаем сохраненные фильтры из localStorage
  filters.value = loadFiltersFromStorage()

  await fetchStocks()

  // Восстанавливаем фильтры после загрузки данных
  await restoreFilters()

  console.log(route.currentRoute.value.query)
})

// Отслеживание изменений данных таблицы
// Обновляет данные диаграммы и восстанавливает фильтры при получении новых данных
watch(
  tableData,
  async (newTableData) => {
    if (columns.value.length > 0 && newTableData.length > 0) {
      if (currentColumnIndex.value >= columns.value.length) {
        currentColumnIndex.value = 0
      }
      const currentColumn = columns.value[currentColumnIndex.value]
      pieData.value = countObjectsByKey(newTableData, currentColumn)

      // Восстанавливаем фильтры при загрузке новых данных
      await restoreFilters()
    }
  },
  { immediate: true },
)

// Отслеживание изменений фильтров и сохранение в localStorage
// Автоматически сохраняет фильтры и перегенерирует доступные опции при изменении
watch(
  filters,
  (newFilters) => {
    saveFiltersToStorage(newFilters)
    // Перегенерируем доступные фильтры при изменении фильтров
    generateAvailableFilters()
  },
  { deep: true },
)
</script>

<template lang="pug">
.wrapp
  .table(v-loading='loading', element-loading-text='Loading...')
    .table__header
      h1.table__title(size='large') {{ props.collection[0].toUpperCase() + props.collection.slice(1) }}
      .table__controls
        el-button(@click='clearAllFilters', type='warning', size='small') Сбросить все фильтры
        el-button(v-if='!loading && !error', @click='refreshData') Обновить
    .table__content(
      v-if='!error && tableData.length > 0',
      :class='{ "table__content--visible": !loading && tableData.length > 0 }'
    )
      el-table(
        ref='tableRef',
        :data='tableData',
        :table-layout='"fixed"',
        style='width: 100%',
        max-height='400',
        :border='true',
        highlight-current-row,
        row-key='id',
        @filter-change='handleFilterChange'
      )
        el-table-column(
          v-for='(column, index) in columns',
          :prop='column',
          :label='column',
          :key='index',
          :column-key='column',
          sortable,
          width='200',
          show-overflow-tooltip,
          :filters='availableFilters[column] || []',
          :filter-method='filterHandler',
          :filtered-value='filters[column] || []',
          :filter-icon='getFilterIcon(column)'
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
    margin-bottom: 16px;
  }

  &__controls {
    display: flex;
    gap: 8px;
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
