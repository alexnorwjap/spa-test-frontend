import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/stocks',
    },
    {
      path: '/stocks',
      name: 'stocks',
      component: () => import('../views/Stocks.vue'),
    },
    {
      path: '/incomes',
      name: 'incomes',
      component: () => import('../views/Incomes.vue'),
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/Orders.vue'),
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/Sales.vue'),
    },
  ],
})

export default router
