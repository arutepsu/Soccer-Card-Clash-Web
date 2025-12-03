declare global {
  interface Window {
    sccSessionId?: string;
  }
}

export class FileIOApi {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/files') {
    this.baseUrl = baseUrl;
  }

  async resolveSessionId(): Promise<string> {
    if (window.sccSessionId && typeof window.sccSessionId === 'string') {
      return window.sccSessionId;
    }

    const body = document.body as HTMLBodyElement | null;
    if (body && body.dataset && body.dataset.sessionId) {
      return body.dataset.sessionId;
    }

    const ls = localStorage.getItem('sccSessionId');
    if (ls) return ls;

    try {
      const resp = await fetch('/api/session/keys', { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json();
        const first = (data.sessions || [])[0];
        if (first) {
          localStorage.setItem('sccSessionId', first);
          return first;
        }
      }
    } catch (e) {
      console.warn('resolveSessionId: fallback failed', e);
    }
    return 'default';
  }

  getCsrfToken(): string | null {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
  }

  async listSavedGames(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing saved games:', error);
      throw error;
    }
  }

  async loadGame(fileName: string, sessionId: string = 'default'): Promise<any> {
    try {
      const csrfToken = this.getCsrfToken();
      const response = await fetch(`${this.baseUrl}/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'Csrf-Token': csrfToken }),
        },
        body: JSON.stringify({
          fileName,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading game:', error);
      throw error;
    }
  }

  async saveGame(fileName: string = 'game.json', sessionId?: string): Promise<any> {
    try {
      const csrfToken = this.getCsrfToken();
      if (!sessionId) sessionId = await this.resolveSessionId();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(csrfToken && {
          'Csrf-Token': csrfToken,
          'X-CSRF-Token': csrfToken,
        }),
      };

      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName,
          sessionId,
        }),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
        } else {
          const text = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}. Response: ${text}`,
          );
        }
      }

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text}`);
      }
    } catch (error) {
      console.error('Error saving game:', error);
      throw error;
    }
  }

  async deleteGame(fileName: string): Promise<any> {
    try {
      const csrfToken = this.getCsrfToken();
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'Csrf-Token': csrfToken }),
        },
        body: JSON.stringify({
          fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  }

  async quickSave(sessionId?: string): Promise<any> {
    if (!sessionId) sessionId = await this.resolveSessionId();
    return this.saveGame('game.json', sessionId);
  }

  async quickLoad(sessionId?: string): Promise<any> {
    if (!sessionId) sessionId = await this.resolveSessionId();
    return this.loadGame('game.json', sessionId);
  }
}

export const fileIOApi = new FileIOApi();
