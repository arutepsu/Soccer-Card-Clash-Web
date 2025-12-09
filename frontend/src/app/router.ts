// frontend/src/app/router.ts
import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from 'vue-router';


import MainMenuView from '../views/MainMenuView.vue';
import MultiplayerView from '../views/MultiPlayerView.vue';
import SinglePlayerView from '../views/SinglePlayerView.vue';
import AISelectionView from '../views/AISelectionView.vue';
import LoadGameView from '../views/LoadGameView.vue';
import LoginView from '../views/LoginView.vue';
import SessionView from '../views/SessionView.vue';

import PlayingFieldView from '../views/PlayingFieldView.vue';
import AttackerHandView from '../views/AttackerHandView.vue';
import AttackerDefendersView from '../views/AttackerDefendersView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/login',        name: 'Login',        component: LoginView },
  { path: '/main-menu',    name: 'MainMenu',     component: MainMenuView },
  { path: '/singleplayer', name: 'SinglePlayer', component: SinglePlayerView },
  { path: '/multiplayer',  name: 'Multiplayer',  component: MultiplayerView },
  { path: '/ai',           name: 'AISelection',  component: AISelectionView },
  { path: '/load-game',    name: 'LoadGame',     component: LoadGameView },
  { path: '/session-screen', name: 'SessionView',  component: SessionView },
  {
    path: '/playing-field',
    name: 'PlayingField',
    component: PlayingFieldView,
  },
  {
    path: '/attacker-hand',
    name: 'AttackerHand',
    component: AttackerHandView,
  },
  {
    path: '/attacker-defenders',
    name: 'AttackerDefenders',
    component: AttackerDefendersView,
  },

  { path: '/', redirect: { name: 'Login' } },

  { path: '/:pathMatch(.*)*', redirect: { name: 'MainMenu' } },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
