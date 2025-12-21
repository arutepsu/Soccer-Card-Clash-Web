export interface AuthMeResponse {
  loggedIn: boolean;
  username?: string;
}

export interface AuthApi {
  me(): Promise<AuthMeResponse>;
  login(username: string, password: string): Promise<AuthMeResponse>;
  logout(): Promise<void>;
}

export function createAuthApi(): AuthApi {
  async function me(): Promise<AuthMeResponse> {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) throw new Error(`/api/auth/me failed: ${res.status}`);
    return res.json();
  }

  async function login(username: string, password: string): Promise<AuthMeResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Login failed: ${res.status}`);
    }

    return res.json();
  }

  async function logout(): Promise<void> {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
  }

  return { me, login, logout };
}
