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
import ChooseNicknameView from '../views/ChooseNicknameView.vue';
import { supabase } from '@/api/supabase';
import { authState } from '@/auth/authState';

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

  { path: '/choose-nickname', name: 'ChooseNickname', component: ChooseNicknameView },

  { path: '/practice', name: 'Practice', component: PlayingFieldView },

  { path: '/', redirect: { name: 'Login' } },

  { path: '/:pathMatch(.*)*', redirect: { name: 'Login' } },

];

export const router = createRouter({
  history: createWebHashHistory('/web/'),
  routes,
});

async function checkAuthOnce(): Promise<void> {
  if (authState.checked) return;

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      authState.setLoggedOut();
      return;
    }

    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      authState.setLoggedOut();
      return;
    }

    const me = (await res.json()) as {
      loggedIn: boolean;
      userId?: string;
      email?: string | null;
      nickname?: string | null;
    };

    if (me.loggedIn) {
      authState.setLoggedIn({
        userId: me.userId,
        nickname: me.nickname ?? null,
        email: me.email ?? null,
      });
    } else {
      authState.setLoggedOut();
    }
  } catch {
    authState.setLoggedOut();
  }
}

router.beforeEach(async (to) => {
  if (!navigator.onLine) {
    const isPracticePF =
      to.name === 'PlayingField' &&
      String(to.query.mode ?? '') === 'local' &&
      String(to.query.kind ?? '') === 'practice';

    if (isPracticePF) return true;

    return { name: 'PlayingField', query: { mode: 'local', kind: 'practice' } };
  }

  await checkAuthOnce();

  if (to.name === 'Login') {
    if (authState.loggedIn) {
      if (!authState.nickname) return { name: 'ChooseNickname' };
      return { name: 'MainMenu' };
    }
    return true;
  }

  if (!authState.loggedIn) return { name: 'Login' };

  if (!authState.nickname && to.name !== 'ChooseNickname') {
    return { name: 'ChooseNickname' };
  }

  if (authState.nickname && to.name === 'ChooseNickname') {
    return { name: 'MainMenu' };
  }

  return true;
});





