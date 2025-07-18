// Импорт основных стилей приложения
import './assets/main.css'

// Импорт функции создания Vue приложения
import { createApp } from 'vue'
// Импорт библиотеки UI компонентов Element Plus
import ElementPlus from 'element-plus'
// Импорт стилей Element Plus
import 'element-plus/dist/index.css'
// Импорт функции создания хранилища состояний Pinia
import { createPinia } from 'pinia'

// Импорт корневого компонента приложения
import App from './App.vue'
// Импорт настроек маршрутизации
import router from './router'

// Создание экземпляра хранилища состояний Pinia
const pinia = createPinia()
// Создание экземпляра Vue приложения с корневым компонентом App
const app = createApp(App)

// Подключение хранилища состояний к приложению
app.use(pinia)
// Подключение маршрутизатора к приложению
app.use(router)
// Подключение библиотеки UI компонентов Element Plus
app.use(ElementPlus)

// Монтирование приложения в DOM элемент с id="app"
app.mount('#app')
