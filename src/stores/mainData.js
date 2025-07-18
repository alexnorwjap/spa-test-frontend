// Импорт реактивных функций Vue 3
import { ref, computed } from 'vue'
// Импорт функции создания хранилища Pinia
import { defineStore } from 'pinia'
// Импорт HTTP клиента для API запросов
import axios from 'axios'

// Экспорт основного хранилища данных приложения
export const useMainStore = defineStore('mainData', () => {
  // Базовый URL для API запросов
  const API_BASE_URL = '/api'
  // Состояние загрузки данных
  const loading = ref(false)
  // Состояние ошибки при загрузке данных
  const error = ref(null)
  // Эндпоинт API для получения заказов
  const API_MAIN_ORDERS = 'orders'
  // API ключ для авторизации запросов
  const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
  // Основные данные заказов за текущий период
  const mainData = ref([])
  // Данные заказов за предыдущий период для сравнения
  const mainDataPrev = ref([])

  // Загрузка фильтров из локального хранилища браузера
  const loadFiltersFromStorage = () => {
    try {
      // Получение сохраненных фильтров из localStorage
      const savedFilters = localStorage.getItem('spa-filters')
      return savedFilters
        ? JSON.parse(savedFilters)
        : {
            article: '', // Фильтр по одному артикулу
            articles: [], // Фильтр по множественным артикулам
            region: '', // Фильтр по региону
            category: '', // Фильтр по категории
            brand: '', // Фильтр по бренду
          }
    } catch (error) {
      console.error('Ошибка при загрузке фильтров из localStorage:', error)
      return {
        article: '',
        articles: [],
        region: '',
        category: '',
        brand: '',
      }
    }
  }

  // Сохранение фильтров в локальное хранилище браузера
  const saveFiltersToStorage = (filters) => {
    try {
      // Сохранение фильтров в localStorage в формате JSON
      localStorage.setItem('spa-filters', JSON.stringify(filters))
    } catch (error) {
      console.error('Ошибка при сохранении фильтров в localStorage:', error)
    }
  }

  // Состояние фильтров приложения
  const filters = ref(loadFiltersFromStorage())

  // Реактивное состояние периодов для сравнения данных
  // Текущий период для анализа данных
  const currentPeriod = ref({
    dateFrom: '2025-07-13', // Дата начала текущего периода
    dateTo: '2025-07-14', // Дата окончания текущего периода
  })

  // Предыдущий период для сравнения с текущим
  const previousPeriod = ref({
    dateFrom: '2025-07-11', // Дата начала предыдущего периода
    dateTo: '2025-07-12', // Дата окончания предыдущего периода
  })

  // Вычисляемые параметры для API запроса текущего периода
  const params = computed(() => ({
    dateFrom: currentPeriod.value.dateFrom, // Дата начала для запроса
    dateTo: currentPeriod.value.dateTo, // Дата окончания для запроса
    page: 1, // Номер страницы для пагинации
    key: API_KEY, // API ключ для авторизации
    limit: 400, // Лимит записей на страницу
  }))

  // Вычисляемые параметры для API запроса предыдущего периода
  const paramsPrev = computed(() => ({
    dateFrom: previousPeriod.value.dateFrom, // Дата начала предыдущего периода
    dateTo: previousPeriod.value.dateTo, // Дата окончания предыдущего периода
    page: 1, // Номер страницы для пагинации
    key: API_KEY, // API ключ для авторизации
    limit: 400, // Лимит записей на страницу
  }))

  // Вычисляемые данные для основной круговой диаграммы
  const pieDataMain = computed(() => {
    // Основные поля для анализа в круговой диаграмме
    const main = ['nm_id', 'total_price', 'discount_percent', 'supplier_article']

    // Преобразование данных в формат для круговой диаграммы
    return main.reduce((acc, key) => {
      acc[key] = countObjectsByKey(mainData.value, key)
      return acc
    }, {})
  })

  // Вычисляемые данные для новой круговой диаграммы с сравнением периодов
  const pieDataNew = computed(() => {
    // Поля для анализа с учетом сравнения периодов
    const main = ['nm_id', 'total_price', 'discount_percent', 'is_cancel']
    return main.reduce((acc, key) => {
      acc[key] = combineDataByArticle(key)
      return acc
    }, {})
  })

  // Асинхронная функция загрузки данных с API
  const fetchData = async () => {
    // Установка состояния загрузки
    loading.value = true
    error.value = null

    try {
      // Параллельная загрузка данных для текущего и предыдущего периодов
      const [response, responsePrev] = await Promise.all([
        axios.get(`${API_BASE_URL}/${API_MAIN_ORDERS}`, {
          params: params.value,
        }),
        axios.get(`${API_BASE_URL}/${API_MAIN_ORDERS}`, {
          params: paramsPrev.value,
        }),
      ])
      // Сохранение полученных данных в состояние
      mainData.value = response.data.data
      mainDataPrev.value = responsePrev.data.data
    } catch (err) {
      // Обработка ошибок при загрузке данных
      error.value = err.response?.data?.message || err.message || 'Произошла ошибка'
      console.error('Ошибка при загрузке данных:', err)
    } finally {
      // Сброс состояния загрузки
      loading.value = false
    }
  }

  // Функция объединения данных по артикулам с вычислением метрик
  // Параметр key - ключ для группировки данных (nm_id, total_price, discount_percent, is_cancel)
  function combineDataByArticle(key = null) {
    // Получаем уникальные артикулы из обоих массивов (используем фильтрованные данные)
    const allArticles = new Set([
      ...filteredMainData.value.map((item) => item.nm_id),
      ...filteredMainDataPrev.value.map((item) => item.nm_id),
    ])

    return Array.from(allArticles)
      .filter((article) => article !== undefined && article !== null)
      .map((article) => {
        // Фильтруем данные по текущему артикулу (используем фильтрованные данные)
        const mainItems = filteredMainData.value.filter((item) => item.nm_id === article)
        const prevItems = filteredMainDataPrev.value.filter((item) => item.nm_id === article)

        // Переменные для хранения вычисленных сумм
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

  // Функция подсчета количества объектов по заданному ключу
  // Параметр array - массив объектов для анализа
  // Параметр key - ключ для группировки и подсчета
  function countObjectsByKey(array, key) {
    // Подсчет количества вхождений каждого значения ключа
    const counts = array
      .filter((obj) => obj[key] !== undefined && obj[key] !== null)
      .reduce((acc, obj) => {
        const value = obj[key]
        acc[value] = (acc[value] || 0) + 1
        return acc
      }, {})

    // Преобразование результата в формат для диаграмм
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }))
  }

  // Функции валидации периодов дат
  // Параметры: даты начала и окончания текущего и предыдущего периодов
  const validatePeriods = (currentFrom, currentTo, prevFrom, prevTo) => {
    // Получение текущей даты с установкой времени на конец дня
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Установка времени на конец сегодняшнего дня

    // Преобразование строковых дат в объекты Date
    const currentFromDate = new Date(currentFrom)
    const currentToDate = new Date(currentTo)
    const prevFromDate = new Date(prevFrom)
    const prevToDate = new Date(prevTo)

    // Текущий период не может быть больше сегодняшнего дня
    if (currentToDate > today) {
      return { valid: false, message: 'Текущий период не может быть больше сегодняшнего дня' }
    }

    // Дата начала текущего периода должна быть меньше или равна дате окончания
    if (currentFromDate > currentToDate) {
      return {
        valid: false,
        message: 'Дата начала текущего периода должна быть меньше даты окончания',
      }
    }

    // Дата начала предыдущего периода должна быть меньше или равна дате окончания
    if (prevFromDate > prevToDate) {
      return {
        valid: false,
        message: 'Дата начала предыдущего периода должна быть меньше даты окончания',
      }
    }

    // Предыдущий период не может пересекаться с текущим периодом
    if (prevToDate >= currentFromDate) {
      return { valid: false, message: 'Предыдущий период не может пересекаться с текущим периодом' }
    }

    return { valid: true }
  }

  // Функция обновления текущего периода
  // Параметры: dateFrom - дата начала, dateTo - дата окончания
  const updateCurrentPeriod = async (dateFrom, dateTo) => {
    const validation = validatePeriods(
      dateFrom,
      dateTo,
      previousPeriod.value.dateFrom,
      previousPeriod.value.dateTo,
    )

    if (!validation.valid) {
      throw new Error(validation.message)
    }

    currentPeriod.value = { dateFrom, dateTo }
    await fetchData()
  }

  // Функция обновления предыдущего периода
  // Параметры: dateFrom - дата начала, dateTo - дата окончания
  const updatePreviousPeriod = async (dateFrom, dateTo) => {
    const validation = validatePeriods(
      currentPeriod.value.dateFrom,
      currentPeriod.value.dateTo,
      dateFrom,
      dateTo,
    )

    if (!validation.valid) {
      throw new Error(validation.message)
    }

    previousPeriod.value = { dateFrom, dateTo }
    await fetchData()
  }

  // Функция обновления обоих периодов одновременно
  // Параметры: currentFrom, currentTo - текущий период; prevFrom, prevTo - предыдущий период
  const updatePeriods = async (currentFrom, currentTo, prevFrom, prevTo) => {
    const validation = validatePeriods(currentFrom, currentTo, prevFrom, prevTo)

    if (!validation.valid) {
      throw new Error(validation.message)
    }

    currentPeriod.value = { dateFrom: currentFrom, dateTo: currentTo }
    previousPeriod.value = { dateFrom: prevFrom, dateTo: prevTo }
    await fetchData()
  }

  // Функции получения отформатированных строк периодов
  // Возвращает строковое представление текущего периода
  const getCurrentPeriodString = computed(() => {
    return `${currentPeriod.value.dateFrom} - ${currentPeriod.value.dateTo}`
  })

  // Возвращает строковое представление предыдущего периода
  const getPreviousPeriodString = computed(() => {
    return `${previousPeriod.value.dateFrom} - ${previousPeriod.value.dateTo}`
  })

  // Функции управления фильтрами
  // Функция обновления фильтров с новыми значениями
  const updateFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    saveFiltersToStorage(filters.value)
  }

  // Функция очистки всех фильтров до значений по умолчанию
  const clearFilters = () => {
    filters.value = {
      article: '',
      articles: [],
      region: '',
      category: '',
      brand: '',
    }
    saveFiltersToStorage(filters.value)
  }

  // Функция применения фильтров к данным
  // Параметр data - массив данных для фильтрации
  const applyFilters = (data) => {
    return data.filter((item) => {
      // Обработка фильтра по артикулам (поддержка одного артикула для Main.vue и множественных для RatePage)
      let articleMatch = true

      if (filters.value.article) {
        // Фильтр по одному артикулу (для Main.vue)
        articleMatch = String(item.nm_id)
          .toLowerCase()
          .includes(filters.value.article.toLowerCase())
      } else if (filters.value.articles && filters.value.articles.length > 0) {
        // Фильтр по множественным артикулам (для RatePage)
        articleMatch =
          filters.value.articles.includes(item.nm_id) ||
          filters.value.articles.includes(String(item.nm_id))
      }

      const regionMatch =
        !filters.value.region ||
        (item.oblast && String(item.oblast).toLowerCase() === filters.value.region.toLowerCase())

      const brandMatch =
        !filters.value.brand ||
        (item.supplier_article &&
          String(item.supplier_article).toLowerCase() === filters.value.brand.toLowerCase())

      return articleMatch && regionMatch && brandMatch
    })
  }

  // Получение отфильтрованных данных
  // Отфильтрованные данные текущего периода
  const filteredMainData = computed(() => applyFilters(mainData.value))
  // Отфильтрованные данные предыдущего периода
  const filteredMainDataPrev = computed(() => applyFilters(mainDataPrev.value))

  return {
    fetchData,
    mainData,
    mainDataPrev,
    filteredMainData,
    filteredMainDataPrev,
    error,
    loading,
    pieDataMain,
    pieDataNew,
    combineDataByArticle,
    params,
    paramsPrev,
    currentPeriod,
    previousPeriod,
    updateCurrentPeriod,
    updatePreviousPeriod,
    updatePeriods,
    validatePeriods,
    getCurrentPeriodString,
    getPreviousPeriodString,
    filters,
    updateFilters,
    clearFilters,
  }
})
