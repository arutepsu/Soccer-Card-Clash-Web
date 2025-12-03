// frontend/src/app/router.ts
import { createRouter,  createMemoryHistory, type RouteRecordRaw } from 'vue-router';

import MainMenuView from '../views/MainMenuView.vue';
import MultiplayerView from '../views/MultiPlayerView.vue';
import SinglePlayerView from '../views/SinglePlayerView.vue';
import AISelectionView from '../views/AISelectionView.vue';
import LoadGameView from '../views/LoadGameView.vue';
import LoginView from '../views/LoginView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/login',       name: 'Login',       component: LoginView },
  { path: '/main-menu',   name: 'MainMenu',    component: MainMenuView },
  { path: '/singleplayer',name: 'SinglePlayer',component: SinglePlayerView },
  { path: '/multiplayer', name: 'Multiplayer', component: MultiplayerView },
  { path: '/ai',          name: 'AISelection', component: AISelectionView },
  { path: '/load-game',   name: 'LoadGame',    component: LoadGameView },

  // optional: root redirect
  { path: '/', redirect: { name: 'Login' } },

  // fallback
  { path: '/:pathMatch(.*)*', redirect: { name: 'MainMenu' } },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});