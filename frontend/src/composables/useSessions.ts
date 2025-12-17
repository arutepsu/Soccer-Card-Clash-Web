// frontend/src/composables/useSessions.ts
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAppServices } from '@/app/appServices';
import { toSessionView, type SessionView } from '@/session/Session';

export function useSessions() {
  const { sessions: sessionApi } = useAppServices();

  const items = ref<SessionView[]>([]);
  const selectedId = ref<string | null>(null);
  const busy = ref(false);
  const error = ref<string | null>(null);

  const selected = computed(() => {
    if (!selectedId.value) return null;
    return items.value.find(s => s.id === selectedId.value) ?? null;
  });

  async function refresh() {
    try {
      error.value = null;
      const dtos = await sessionApi.listSessions();
      items.value = dtos.map(toSessionView);

      if (selectedId.value && !items.value.some(s => s.id === selectedId.value)) {
        selectedId.value = null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  let timer: number | null = null;

  function startPolling(ms = 2000) {
    stopPolling();
    timer = window.setInterval(() => {
      if (!busy.value) void refresh();
    }, ms);
  }

  function stopPolling() {
    if (timer != null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  async function createSession(hostName: string, name: string) {
    busy.value = true;
    try {
      error.value = null;
      const created = await sessionApi.createSession({ hostName, name });
      await refresh();
      selectedId.value = created.id;
      return created;
    } finally {
      busy.value = false;
    }
  }

  async function joinSession(sessionId: string, playerName: string) {
    busy.value = true;
    try {
      error.value = null;
      const res = await sessionApi.joinSession(sessionId, { playerName });
      await refresh();
      return res;
    } finally {
      busy.value = false;
    }
  }

  onMounted(async () => {
    await refresh();
    startPolling();
  });

  onUnmounted(() => stopPolling());

  return {
    items,
    selectedId,
    selected,
    busy,
    error,
    refresh,
    createSession,
    joinSession,
  };
}
