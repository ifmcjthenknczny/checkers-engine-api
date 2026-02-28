import AnalysisPage from '@/pages/AnalysisPage.vue'
import PlayPage from '@/pages/PlayPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const MAIN_PAGE_TITLE = 'WARCABY'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AnalysisPage,
      meta: { title: `${MAIN_PAGE_TITLE} - Analiza` },
    },
    {
      path: '/play',
      name: 'play',
      component: PlayPage,
      meta: { title: `${MAIN_PAGE_TITLE} - Gra` },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const pageTitle = to.meta.title as string
  document.title = pageTitle || MAIN_PAGE_TITLE
  next()
})

export default router
