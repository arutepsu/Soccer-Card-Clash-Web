// frontend/src/app/router.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import MainMenuView from '../views/MainMenuView.vue'
import MultiplayerView from '../views/MultiPlayerView.vue';
import SinglePlayerView from '../views/SinglePlayerView.vue';
import AISelectionView from '../views/AISelectionView.vue';
import LoadGameView from '../views/LoadGameView.vue';
import LoginView from '../views/LoginView.vue';

import PlayingFieldView from '../views/game/PlayingFieldView.vue';
import AttackerHandCardsView from '../views/game/AttackerHandCardsView.vue';
import AttackerDefenderCardsView from '../views/game/AttackerDefenderCardsView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'MainMenu',
    component: MainMenuView,
  },
  {
    path: '/multiplayer',
    name: 'Multiplayer',
    component: MultiplayerView,
  },
  {
    path: '/single-player',
    name: 'SinglePlayer',
    component: SinglePlayerView,
  },
  {
    path: '/ai-selection',
    name: 'AISelection',
    component: AISelectionView,
  },
  {
    path: '/load-game',
    name: 'LoadGame',
    component: LoadGameView,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },

  // Game views
  {
    path: '/game',
    name: 'PlayingField',
    component: PlayingFieldView,
  },
  {
    path: '/game/attacker-hand',
    name: 'AttackerHandCards',
    component: AttackerHandCardsView,
  },
  {
    path: '/game/attacker-defenders',
    name: 'AttackerDefenderCards',
    component: AttackerDefenderCardsView,
  },

  // Fallback: redirect unknown routes to main menu
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'MainMenu' },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
