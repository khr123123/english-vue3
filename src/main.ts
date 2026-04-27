/**
 * main.ts — 应用入口文件 / Application entry point
 *
 * 创建 Vue 应用实例，挂载路由插件，并启动应用
 * Creates the Vue app instance, installs router plugin, and mounts
 */

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'

// 创建应用实例并挂载 / Create and mount the app
const app = createApp(App)
app.use(router)
app.mount('#app')
