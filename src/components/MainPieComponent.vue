<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted, watch } from 'vue'

const chartContainer = ref(null)
let myChart = null

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'Источники трафика',
  },
  pin: String,
})
const emit = defineEmits(['chart-click'])

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

watch(
  () => props.data,
  () => {
    updateChart()
  },
  { deep: true },
)

watch(
  () => props.title,
  () => {
    updateChart()
  },
)

watch(
  () => props.pin,
  () => {
    updateChart()
  },
)

let resizeHandler = null

onMounted(() => {
  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value)
    updateChart()

    resizeHandler = () => {
      myChart?.resize()
    }
    window.addEventListener('resize', resizeHandler)
  }
})

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
