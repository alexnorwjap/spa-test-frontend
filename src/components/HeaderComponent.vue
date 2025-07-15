<script setup>
</script>

<template lang="pug">
header.header
  nav.header__navigation
    ul.header__list
      li.header__item
        RouterLink.header__link(to='/') Main
      li.header__item
        RouterLink.header__link(to='/stocks') Stocks
      li.header__item
        RouterLink.header__link(to='/incomes') Incomes
      li.header__item
        RouterLink.header__link(to='/orders') Orders
      li.header__item
        RouterLink.header__link(to='/sales') Sales
</template>

<style scoped lang="scss">
.header {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 0;

  &__navigation {
  }
  &__list {
    display: flex;
    gap: 20px;
    font-size: 1.5rem;
  }
  &__item {
    margin: 0 10px;
  }
  &__link {
    color: var(--el-text-color-regular);

    &:hover,
    &:active,
    &:focus {
      color: var(--el-color-primary);
    }
  }
}
</style>
