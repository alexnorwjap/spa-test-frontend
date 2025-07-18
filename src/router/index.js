// Импорт функций для создания роутера и истории браузера
import { createRouter, createWebHistory } from 'vue-router'

// Создание экземпляра роутера с настройками маршрутизации
const router = createRouter({
  // Использование HTML5 History API для навигации
  history: createWebHistory(import.meta.env.BASE_URL),
  // Массив маршрутов приложения
  routes: [
    {
      // Корневой путь - перенаправление на главную страницу
      path: '/',
      redirect: '/main',
    },
    {
      // Главная страница с аналитикой и диаграммами
      path: '/main',
      name: 'main',
      component: () => import('../views/Main.vue'),
    },
    {
      // Страница детальной информации об артикуле с динамическим параметром id
      path: '/article/:id',
      name: 'article',
      component: () => import('../views/ArticlePage.vue'),
    },
    {
      // Страница рейтинга товаров с возможностью фильтрации
      path: '/rate',
      name: 'rate',
      component: () => import('../views/RatePage.vue'),
    },
    {
      // Страница управления остатками товаров
      path: '/stocks',
      name: 'stocks',
      component: () => import('../views/Stocks.vue'),
    },
    {
      // Страница отслеживания поступлений товаров
      path: '/incomes',
      name: 'incomes',
      component: () => import('../views/Incomes.vue'),
    },
    {
      // Страница управления заказами
      path: '/orders',
      name: 'orders',
      component: () => import('../views/Orders.vue'),
    },
    {
      // Страница анализа продаж
      path: '/sales',
      name: 'sales',
      component: () => import('../views/Sales.vue'),
    },
  ],
})

// Экспорт настроенного роутера для использования в приложении
export default router
