<!-- Компонент заголовка с навигационным меню -->
<script setup>
// Компонент не требует дополнительной логики, использует только маршрутизацию
</script>

<template lang="pug">
// Основной заголовок страницы с навигацией
header.header
  // Навигационное меню
  nav.header__navigation
    // Список навигационных ссылок
    ul.header__list
      // Ссылка на главную страницу
      li.header__item
        RouterLink.header__link(to='/') Main
      // Ссылка на страницу складов
      li.header__item
        RouterLink.header__link(to='/stocks') Stocks
      // Ссылка на страницу доходов
      li.header__item
        RouterLink.header__link(to='/incomes') Incomes
      // Ссылка на страницу заказов
      li.header__item
        RouterLink.header__link(to='/orders') Orders
      // Ссылка на страницу продаж
      li.header__item
        RouterLink.header__link(to='/sales') Sales
</template>

<!-- Стили компонента заголовка -->
<style scoped lang="scss">
// Основной контейнер заголовка
.header {
  max-width: 1200px; // Максимальная ширина заголовка
  margin: 0 auto; // Центрирование по горизонтали
  padding: 40px 0; // Внутренние отступы сверху и снизу

  // Контейнер навигации
  &__navigation {
  }

  // Список навигационных элементов
  &__list {
    display: flex; // Горизонтальное расположение элементов
    gap: 20px; // Промежуток между элементами
    font-size: 1.5rem; // Размер шрифта навигационных ссылок
  }

  // Отдельный элемент навигации
  &__item {
    margin: 0 10px; // Внешние отступы слева и справа
  }

  // Стили навигационных ссылок
  &__link {
    color: var(--el-text-color-regular); // Обычный цвет текста из Element Plus

    // Стили при наведении, активном состоянии и фокусе
    &:hover,
    &:active,
    &:focus {
      color: var(--el-color-primary); // Основной цвет темы Element Plus
    }
  }
}
</style>
