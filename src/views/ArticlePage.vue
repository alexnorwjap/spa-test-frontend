<script setup>
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainData.js'
import { onMounted, computed, ref } from 'vue'
import { Top, Bottom, SemiSelect, ArrowLeft, Picture, Loading } from '@element-plus/icons-vue'
import PeriodSelector from '@/components/PeriodSelector.vue'

// Подключение к главному хранилищу данных приложения
const store = useMainStore()
// Объект маршрутизатора для навигации между страницами
const route = useRouter()
// Идентификатор артикула из параметров URL при загрузке страницы
const initialArticleId = route.currentRoute.value.params.id

// Реактивная переменная для хранения выбранного артикула
const selectedArticle = ref(initialArticleId)

// Вычисляемое свойство для получения списка доступных артикулов
// Создает отсортированный список всех уникальных артикулов из данных
const availableArticles = computed(() => {
  const articles = new Set()

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

// Вычисляемое свойство для получения данных выбранного артикула
// Находит запись в основных данных по выбранному артикулу
const selectedArticleData = computed(() => {
  if (!selectedArticle.value) return null

  const articleRecord = store.mainData.find(
    (item) =>
      item.nm_id === selectedArticle.value ||
      item.nm_id === Number(selectedArticle.value) ||
      String(item.nm_id) === String(selectedArticle.value),
  )

  return articleRecord || null
})

// Вычисляемое свойство для получения данных по всем 4 показателям для конкретного артикула
// Собирает аналитические данные по выбранному артикулу для всех категорий метрик
const articleData = computed(() => {
  const categories = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']

  return categories.map((category) => {
    const allData = store.combineDataByArticle(category)
    // Преобразуем selectedArticle в строку и число для поиска
    const articleInfo = allData.find(
      (item) =>
        item.nm_id === selectedArticle.value ||
        item.nm_id === Number(selectedArticle.value) ||
        String(item.nm_id) === String(selectedArticle.value),
    )

    return {
      category,
      categoryName: getCategoryName(category),
      data: articleInfo || {
        nm_id: selectedArticle.value,
        mainSum: 0,
        prevSum: 0,
        difference: '0%',
      },
    }
  })
})

// Вычисляемое свойство для формирования данных таблицы с показателями по периодам
// Преобразует данные артикула в формат для отображения в таблице сравнения периодов
const tableData = computed(() => {
  if (!articleData.value || articleData.value.length === 0) return []

  return articleData.value.map((metric) => ({
    indicator: metric.categoryName,
    currentPeriod: metric.data.mainSum,
    previousPeriod: metric.data.prevSum,
    difference: metric.data.difference,
    category: metric.category,
  }))
})

// Вычисляемые свойства для получения строковых представлений периодов из store
const currentPeriod = computed(() => store.getCurrentPeriodString)   // Текущий период в виде строки
const previousPeriod = computed(() => store.getPreviousPeriodString) // Предыдущий период в виде строки

// Функция получения читаемого названия категории метрики
// Преобразует техническое название поля в понятное пользователю название
const getCategoryName = (category) => {
  const names = {
    nm_id: 'Количество покупок',
    total_price: 'Сумма продаж',
    discount_percent: 'Средний процент скидки',
    is_cancel: 'Количество отмененных заказов',
  }
  return names[category] || category
}

// Вспомогательная функция для форматирования названий полей для отображения
// Преобразует технические названия полей в читаемые пользователем названия
const formatFieldName = (fieldName) => {
  const fieldNames = {
    nm_id: 'Артикул',
    total_price: 'Сумма продаж',
    discount_percent: 'Процент скидки',
    is_cancel: 'Отменен',
    supplier_article: 'Артикул поставщика',
    oblast: 'Регион',
    date: 'Дата',
    quantity: 'Количество',
    price: 'Цена',
    brand: 'Бренд',
    category: 'Категория',
    warehouse: 'Склад',
    delivery_type: 'Тип доставки',
  }
  return (
    fieldNames[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  )
}

// Вспомогательная функция для форматирования значений полей для отображения
// Обрабатывает различные типы данных и приводит их к читаемому виду
const formatFieldValue = (value) => {
  if (value === null || value === undefined) {
    return 'Не указано'
  }
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

// Функция получения иконки и цвета для отображения изменений показателей
// Возвращает соответствующую иконку и цвет в зависимости от направления изменения
const getChangeIcon = (difference) => {
  if (difference.startsWith('+')) {
    return { icon: Top, color: '#67C23A' }
  } else if (difference.startsWith('-')) {
    return { icon: Bottom, color: '#F56C6C' }
  } else {
    return { icon: SemiSelect, color: '#909399' }
  }
}

// Функция возврата на предыдущую страницу
// Использует встроенную функцию маршрутизатора для навигации назад
const goBack = () => {
  route.back()
}

// Хук монтирования компонента
// Инициализирует страницу: загружает данные если их нет, выводит отладочную информацию
onMounted(async () => {
  if (!store.mainData.length) {
    await store.fetchData()
  }
  console.log('🔍 ArticlePage Debug Info:')
  console.log('Article ID:', selectedArticle.value, 'Type:', typeof selectedArticle.value)
  console.log('Initial Article ID:', initialArticleId, 'Type:', typeof initialArticleId)
  console.log('Store mainData length:', store.mainData.length)
  console.log('Store mainDataPrev length:', store.mainDataPrev.length)
  console.log('Article Data:', articleData.value)
  console.log('Table Data:', tableData.value)
  console.log('Current Period:', currentPeriod.value)
  console.log('Previous Period:', previousPeriod.value)
  console.log('Selected Article Data:', selectedArticleData.value)

  // Проверим, есть ли данные для этого артикула в сыром виде
  const rawMainData = store.mainData.filter(
    (item) =>
      item.nm_id === selectedArticle.value ||
      item.nm_id === Number(selectedArticle.value) ||
      String(item.nm_id) === String(selectedArticle.value),
  )
  const rawPrevData = store.mainDataPrev.filter(
    (item) =>
      item.nm_id === selectedArticle.value ||
      item.nm_id === Number(selectedArticle.value) ||
      String(item.nm_id) === String(selectedArticle.value),
  )
  console.log('Raw main data for article:', rawMainData)
  console.log('Raw prev data for article:', rawPrevData)
})
</script>

<template lang="pug">
// Лоадер
.loading-container(v-if='store.loading')
  .loading-content
    el-icon.loading-icon(size='48')
      Loading
    p.loading-text Загрузка данных...

.article-page(v-else-if='!store.error && store.mainData.length > 0')
  .header
    el-button(@click='goBack', type='primary', :icon='ArrowLeft') Назад
    h1.title Показатели артикула: {{ selectedArticle }}

  // Селектор периодов
  .header-controls
    PeriodSelector
    .filter-container
      .filter-header
        h3.filter-title Выбор артикула
      .filter-row
        .filter-item
          label.filter-label Артикул:
          el-select(
            v-model='selectedArticle',
            placeholder='Выберите артикул',
            size='small',
            clearable,
            filterable,
            style='width: 200px'
          )
            el-option(
              v-for='article in availableArticles',
              :key='article.value',
              :label='article.label',
              :value='article.value'
            )

  // Фильтр по артикулу

  .content
    .left-panel
      .article-info
        h2.info-title Информация об артикуле
        .info-item(v-if='selectedArticleData')
          template(v-for='(value, key) in selectedArticleData', :key='key')
            .info-row
              .info-label {{ formatFieldName(key) }}:
              .info-value {{ formatFieldValue(value) }}
        .info-item(v-else)
          .info-label Артикул не выбран или данные недоступны

      .article-image
        .image-placeholder
          el-icon.image-icon
            Picture
          .image-text Изображение недоступно

    .right-panel
      .table-container
        h2.table-title Показатели по периодам
        el-table.metrics-table(
          :data='tableData',
          :border='true',
          style='width: 100%',
          :table-layout='"fixed"'
        )
          el-table-column(prop='indicator', label='Показатель', width='200', show-overflow-tooltip)
          el-table-column(
            :label='`Текущий период (${currentPeriod})`',
            prop='currentPeriod',
            width='180',
            align='center'
          )
          el-table-column(
            :label='`Предыдущий период (${previousPeriod})`',
            prop='previousPeriod',
            width='180',
            align='center'
          )
          el-table-column(label='Изменение (%)', prop='difference', width='140', align='center')
            template(#default='{ row }')
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

.article-page {
  width: 100%;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;

  .title {
    font-size: 24px;
    color: #333;
    margin: 0;
  }
}

.header-controls {
  display: flex;
  gap: 20px;
}

.filter-container {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .filter-header {
    margin-bottom: 15px;

    .filter-title {
      font-size: 16px;
      color: #333;
      margin: 0;
    }
  }

  .filter-row {
    display: flex;
    gap: 15px;
    align-items: center;

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
  }
}

.content {
  display: flex;
  justify-content: space-between;
  gap: 30px;
}

.left-panel {
  width: 30%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-info {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-height: 600px;
  overflow-y: auto;

  .info-title {
    font-size: 18px;
    color: #333;
    margin: 0 0 10px 0;
    border-bottom: 1px solid #e4e7ed;
    padding-bottom: 10px;
  }

  .info-item {
    padding: 0;

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f5f7fa;

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        font-weight: 500;
        color: #666;
        min-width: 120px;
      }

      .info-value {
        font-weight: 600;
        color: #333;
        text-align: right;
        word-break: break-word;
      }
    }

    // For the case when no article is selected
    .info-label {
      font-weight: 500;
      color: #666;
      padding: 10px 0;
    }
  }
}

.article-image {
  order: -1;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;

  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    background: #f5f7fa;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    color: #909399;

    .image-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .image-text {
      font-size: 14px;
    }
  }
}

.right-panel {
  flex: 0 0 50.666%;
}

.table-container {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;

  .table-title {
    font-size: 18px;
    color: #333;
    margin: 0 0 20px 0;
    border-bottom: 1px solid #e4e7ed;
    padding-bottom: 10px;
  }

  .metrics-table {
    width: 100%;
  }
}

.change-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  .change-icon {
    font-size: 14px;
  }

  .change-text {
    font-weight: 500;
  }
}
</style>
