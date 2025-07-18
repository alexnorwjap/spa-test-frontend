<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMainStore } from '@/stores/mainData'
import { ElMessage } from 'element-plus'

// Подключение к главному хранилищу данных приложения
const store = useMainStore()
// Сообщение об ошибке для отображения пользователю
const errorMessage = ref('')

// Диапазоны дат для компонентов выбора периодов
const currentDateRange = ref([])      // Текущий период (массив из двух дат)
const previousDateRange = ref([])     // Предыдущий период (массив из двух дат)

// Инициализация диапазонов дат из хранилища при монтировании компонента
onMounted(() => {
  currentDateRange.value = [store.currentPeriod.dateFrom, store.currentPeriod.dateTo]
  previousDateRange.value = [store.previousPeriod.dateFrom, store.previousPeriod.dateTo]
})

// Функция валидации дат для текущего периода
// Запрещает выбор дат позже сегодняшнего дня
const disabledCurrentDates = (date) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

// Функция валидации дат для предыдущего периода
// Запрещает выбор дат позже сегодняшнего дня и пересечение с текущим периодом
const disabledPreviousDates = (date) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  // Запрещаем даты после сегодняшнего дня
  if (date > today) return true

  // Если выбран текущий период, запрещаем даты, которые пересекаются с ним
  if (currentDateRange.value && currentDateRange.value.length === 2) {
    const currentFromDate = new Date(currentDateRange.value[0])
    return date >= currentFromDate
  }

  return false
}

// Вычисляемое свойство для проверки валидности текущего выбора периодов
// Возвращает true, если оба периода выбраны корректно и не пересекаются
const isValidSelection = computed(() => {
  if (!currentDateRange.value || currentDateRange.value.length !== 2) return false
  if (!previousDateRange.value || previousDateRange.value.length !== 2) return false

  const validation = store.validatePeriods(
    currentDateRange.value[0],
    currentDateRange.value[1],
    previousDateRange.value[0],
    previousDateRange.value[1],
  )

  return validation.valid
})

// Обработчик изменения текущего периода
// Проверяет валидность нового периода относительно предыдущего
const handleCurrentPeriodChange = (value) => {
  errorMessage.value = ''
  if (value && value.length === 2) {
    // Проверяем, не сделает ли это предыдущий период невалидным
    if (previousDateRange.value && previousDateRange.value.length === 2) {
      const validation = store.validatePeriods(
        value[0],
        value[1],
        previousDateRange.value[0],
        previousDateRange.value[1],
      )
      if (!validation.valid) {
        errorMessage.value = validation.message
      }
    }
  }
}

// Обработчик изменения предыдущего периода
// Проверяет валидность нового периода относительно текущего
const handlePreviousPeriodChange = (value) => {
  errorMessage.value = ''
  if (value && value.length === 2) {
    // Проверяем, не сделает ли это выбор невалидным
    if (currentDateRange.value && currentDateRange.value.length === 2) {
      const validation = store.validatePeriods(
        currentDateRange.value[0],
        currentDateRange.value[1],
        value[0],
        value[1],
      )
      if (!validation.valid) {
        errorMessage.value = validation.message
      }
    }
  }
}

// Функция применения выбранных периодов
// Обновляет периоды в хранилище и показывает уведомления пользователю
const applyPeriods = async () => {
  if (!isValidSelection.value) {
    ElMessage.error('Пожалуйста, выберите корректные периоды')
    return
  }

  try {
    errorMessage.value = ''
    await store.updatePeriods(
      currentDateRange.value[0],
      currentDateRange.value[1],
      previousDateRange.value[0],
      previousDateRange.value[1],
    )
    ElMessage.success('Периоды успешно обновлены')
  } catch (error) {
    errorMessage.value = error.message
    ElMessage.error(error.message)
  }
}

// Отслеживание изменений текущего периода в хранилище для обновления локального состояния
// Синхронизирует локальные переменные с данными из store
watch(
  () => store.currentPeriod,
  (newVal) => {
    currentDateRange.value = [newVal.dateFrom, newVal.dateTo]
  },
  { deep: true },
)

// Отслеживание изменений предыдущего периода в хранилище для обновления локального состояния
// Синхронизирует локальные переменные с данными из store
watch(
  () => store.previousPeriod,
  (newVal) => {
    previousDateRange.value = [newVal.dateFrom, newVal.dateTo]
  },
  { deep: true },
)
</script>

<template lang="pug">
.period-selector
  h3.period-selector__title Выбор периодов

  .period-selector__content
    // Current Period
    .period-group
      label.period-label Текущий:
      .date-range
        el-date-picker(
          v-model="currentDateRange"
          type="daterange"
          range-separator="до"
          start-placeholder="Дата начала"
          end-placeholder="Дата окончания"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledCurrentDates"
          @change="handleCurrentPeriodChange"
        )

    // Previous Period
    .period-group
      label.period-label Предыдущий:
      .date-range
        el-date-picker(
          v-model="previousDateRange"
          type="daterange"
          range-separator="до"
          start-placeholder="Дата начала"
          end-placeholder="Дата окончания"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledPreviousDates"
          @change="handlePreviousPeriodChange"
        )

    // Apply Button
    .period-actions
      el-button(
        type="primary"
        @click="applyPeriods"
        :loading="store.loading"
        :disabled="!isValidSelection"
      ) Применить

  // Error Display
  .error-message(v-if="errorMessage")
    el-alert(
      :title="errorMessage"
      type="error"
      :closable="false"
      show-icon
    )
</template>

<style scoped lang="scss">
.period-selector {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  &__title {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  &__content {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }
}

.period-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 768px) {
    align-items: center;
    gap: 16px;
  }
}

.period-label {
  font-weight: 500;
  color: #555;
  min-width: 140px;
}

.date-range {
  flex: 1;
}

.period-actions {
  display: flex;
  justify-content: flex-end;
}

.error-message {
  margin-top: 16px;
}

@media (max-width: 767px) {
  .period-selector {
    padding: 16px;
  }

  .period-group {
    gap: 8px;
  }

  .period-actions {
    justify-content: center;
  }
}
</style>
