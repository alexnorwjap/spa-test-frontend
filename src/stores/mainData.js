import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useMainStore = defineStore('mainData', () => {
  const API_BASE_URL = '/api'
  const loading = ref(false)
  const error = ref(null)
  const API_MAIN_ORDERS = 'orders'
  const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
  const mainData = ref([])
  const mainDataPrev = ref([])
  const params = computed(() => ({
    dateFrom: '2025-07-13',
    dateTo: '2025-07-14',
    page: 1,
    key: API_KEY,
    limit: 400,
  }))
  const paramsPrev = computed(() => ({
    dateFrom: '2025-07-11',
    dateTo: '2025-07-12',
    page: 1,
    key: API_KEY,
    limit: 400,
  }))

  const pieDataMain = computed(() => {
    const main = ['nm_id', 'total_price', 'discount_percent', 'supplier_article']

    return main.reduce((acc, key) => {
      acc[key] = countObjectsByKey(mainData.value, key)
      return acc
    }, {})
  })

  const pieDataNew = computed(() => {
    const main = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']
    return main.reduce((acc, key) => {
      acc[key] = combineDataByArticle(key)
      return acc
    }, {})
  })

  const fetchData = async () => {
    loading.value = true
    error.value = null

    try {
      const [response, responsePrev] = await Promise.all([
        axios.get(`${API_BASE_URL}/${API_MAIN_ORDERS}`, {
          params: params.value,
        }),
        axios.get(`${API_BASE_URL}/${API_MAIN_ORDERS}`, {
          params: paramsPrev.value,
        }),
      ])
      mainData.value = response.data.data
      mainDataPrev.value = responsePrev.data.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Произошла ошибка'
      console.error('Ошибка при загрузке данных:', err)
    } finally {
      loading.value = false
    }
  }

  function combineDataByArticle(key = null) {
    // Получаем уникальные артикулы из обоих массивов
    const allArticles = new Set([
      ...mainData.value.map((item) => item.nm_id),
      ...mainDataPrev.value.map((item) => item.nm_id),
    ])

    return Array.from(allArticles)
      .filter((article) => article !== undefined && article !== null)
      .map((article) => {
        // Фильтруем данные по текущему артикулу
        const mainItems = mainData.value.filter((item) => item.nm_id === article)
        const prevItems = mainDataPrev.value.filter((item) => item.nm_id === article)

        let mainSum, prevSum

        if (!key || key === 'nm_id') {
          // Если ключ не передан или nm_id - считаем количество артикулов (покупок)
          mainSum = mainItems.length
          prevSum = prevItems.length
        } else if (key === 'total_price') {
          // Для total_price - считаем сумму
          mainSum = mainItems
            .filter((item) => item[key] !== undefined && item[key] !== null)
            .reduce((sum, item) => {
              const value = Number(item[key])
              return sum + (isNaN(value) ? 0 : value)
            }, 0)

          prevSum = prevItems
            .filter((item) => item[key] !== undefined && item[key] !== null)
            .reduce((sum, item) => {
              const value = Number(item[key])
              return sum + (isNaN(value) ? 0 : value)
            }, 0)
        } else if (key === 'discount_percent') {
          // Для discount_percent - считаем средний процент
          const mainValidItems = mainItems.filter(
            (item) => item[key] !== undefined && item[key] !== null && !isNaN(Number(item[key])),
          )
          const prevValidItems = prevItems.filter(
            (item) => item[key] !== undefined && item[key] !== null && !isNaN(Number(item[key])),
          )

          mainSum =
            mainValidItems.length > 0
              ? mainValidItems.reduce((sum, item) => sum + Number(item[key]), 0) /
                mainValidItems.length
              : 0

          prevSum =
            prevValidItems.length > 0
              ? prevValidItems.reduce((sum, item) => sum + Number(item[key]), 0) /
                prevValidItems.length
              : 0
        } else if (key === 'is_cancel') {
          // Для is_cansel - считаем количество отмененных заказов
          mainSum = mainItems.filter(
            (item) =>
              item[key] !== undefined &&
              item[key] !== null &&
              (item[key] === true || item[key] === 1 || item[key] === '1'),
          ).length

          prevSum = prevItems.filter(
            (item) =>
              item[key] !== undefined &&
              item[key] !== null &&
              (item[key] === true || item[key] === 1 || item[key] === '1'),
          ).length
        } else {
          // Для других ключей - считаем сумму (по умолчанию)
          mainSum = mainItems
            .filter((item) => item[key] !== undefined && item[key] !== null)
            .reduce((sum, item) => {
              const value = Number(item[key])
              return sum + (isNaN(value) ? 0 : value)
            }, 0)

          prevSum = prevItems
            .filter((item) => item[key] !== undefined && item[key] !== null)
            .reduce((sum, item) => {
              const value = Number(item[key])
              return sum + (isNaN(value) ? 0 : value)
            }, 0)
        }

        // Вычисляем разность в процентах
        let differencePercent = 0
        if (prevSum !== 0) {
          differencePercent = ((mainSum - prevSum) / prevSum) * 100
        } else if (mainSum > 0) {
          differencePercent = 100 // Если предыдущее значение 0, а текущее больше 0, то рост 100%
        }

        // Форматируем процент со знаком
        const formattedDifference =
          differencePercent > 0
            ? `+${Math.round(differencePercent * 100) / 100}%`
            : `${Math.round(differencePercent * 100) / 100}%`

        return {
          nm_id: article,
          mainSum: Math.round(mainSum * 100) / 100,
          prevSum: Math.round(prevSum * 100) / 100,
          difference: formattedDifference,
        }
      })
      .sort((a, b) => a.nm_id - b.nm_id)
  }

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

  return {
    fetchData,
    mainData,
    mainDataPrev,
    error,
    loading,
    pieDataMain,
    pieDataNew,
    combineDataByArticle,
  }
})
