<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Ссылка на DOM-элемент контейнера для диаграммы
const chartContainer = ref(null)
// Экземпляр диаграммы ECharts
let myChart = null

// Входные параметры компонента
const props = defineProps({
  data: {                              // Данные для отображения в круговой диаграмме
    type: Array,
    default: () => [],
  },
  title: {                             // Заголовок диаграммы
    type: String,
    default: 'Источники трафика',
  },
  pin: String,                         // Название серии данных для диаграммы
})
// События, которые может генерировать компонент
const emit = defineEmits(['chart-click'])

// Функция обновления конфигурации и перерисовки диаграммы
// Применяет новые данные, заголовок и настройки к диаграмме
const updateChart = () => {
  if (chartContainer.value && myChart) {
    const option = {
      title: {
        text: props.title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          color: '#333',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)',
      },
      series: [
        {
          name: props.pin,
          type: 'pie',
          radius: '85%',
          center: ['50%', '55%'],
          selectedMode: 'single',
          selectedOffset: 15,
          data: props.data,
          label: {
            show: true,
            position: 'inside',
            fontSize: 12,
          },
        },
      ],
    }
    myChart.setOption(option)

    setupClickHandler()
  }
}

// Функция настройки обработчика кликов по диаграмме
// Генерирует событие chart-click при клике на сегмент диаграммы
const setupClickHandler = () => {
  if (myChart) {
    myChart.off('click')
    myChart.on('click', (params) => {
      emit('chart-click', {
        name: params.seriesName,
        data: {
          name: params.name,
          value: params.value,
        },
      })
    })
  }
}

// Отслеживание изменений данных диаграммы
// При изменении данных автоматически перерисовывает диаграмму
watch(
  () => props.data,
  () => {
    updateChart()
  },
  { deep: true },
)

// Отслеживание изменений заголовка диаграммы
// При изменении заголовка автоматически обновляет диаграмму
watch(
  () => props.title,
  () => {
    updateChart()
  },
)

// Отслеживание изменений названия серии данных
// При изменении pin автоматически обновляет диаграмму
watch(
  () => props.pin,
  () => {
    updateChart()
  },
)

// Обработчик события изменения размера окна браузера
let resizeHandler = null

// Хук монтирования компонента
// Инициализирует диаграмму ECharts и настраивает обработчик изменения размера
onMounted(() => {
  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value)
    updateChart()

    // Функция для адаптации размера диаграммы при изменении размера окна
    resizeHandler = () => {
      myChart?.resize()
    }
    window.addEventListener('resize', resizeHandler)
  }
})

// Хук размонтирования компонента
// Очищает ресурсы диаграммы и удаляет обработчики событий
onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template lang="pug">
.pie-chart
  #chart-container(ref='chartContainer')
</template>

<style scoped lang="scss">
.pie-chart {
  width: 100%;
  height: 300px;

  #chart-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
