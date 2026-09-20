const API_BASE = '/api';

class ApiClient {
  private token: string | null = localStorage.getItem('zyro_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('zyro_token', token);
    } else {
      localStorage.removeItem('zyro_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // Auth
  async register(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getMe() {
    return this.request<any>('/me');
  }

  // Servers
  async getServers() {
    return this.request<any[]>('/servers');
  }

  async createServer(data: { name: string; version: string; software: string }) {
    return this.request<any>('/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getServer(id: string) {
    return this.request<any>(`/servers/${id}`);
  }

  async deleteServer(id: string) {
    return this.request<any>(`/servers/${id}`, { method: 'DELETE' });
  }

  async startServer(id: string) {
    return this.request<any>(`/servers/${id}/start`, { method: 'POST' });
  }

  async stopServer(id: string) {
    return this.request<any>(`/servers/${id}/stop`, { method: 'POST' });
  }

  async restartServer(id: string) {
    return this.request<any>(`/servers/${id}/restart`, { method: 'POST' });
  }

  async getServerStatus(id: string) {
    return this.request<any>(`/servers/${id}/status`);
  }

  async getServerLogs(id: string) {
    return this.request<{ logs: string }>(`/servers/${id}/logs`);
  }

  // Files
  async getFiles(id: string, path: string = '/') {
    return this.request<any>(`/servers/${id}/files?path=${encodeURIComponent(path)}`);
  }

  async createFile(id: string, path: string, content?: string, isDir?: boolean) {
    return this.request<any>(`/servers/${id}/files`, {
      method: 'POST',
      body: JSON.stringify({ path, content, isDir }),
    });
  }

  async deleteFile(id: string, path: string) {
    return this.request<any>(`/servers/${id}/files`, {
      method: 'DELETE',
      body: JSON.stringify({ path }),
    });
  }

  async updateFile(id: string, path: string, content: string, newName?: string) {
    return this.request<any>(`/servers/${id}/files`, {
      method: 'PUT',
      body: JSON.stringify({ path, content, newName }),
    });
  }

  // Settings
  async getSettings(id: string) {
    return this.request<any>(`/servers/${id}/settings`);
  }

  async updateSettings(id: string, settings: Record<string, string>) {
    return this.request<any>(`/servers/${id}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Admin
  async adminGetUsers() {
    return this.request<any[]>('/admin/users');
  }

  async adminGetServers() {
    return this.request<any[]>('/admin/servers');
  }

  async adminStartServer(id: string) {
    return this.request<any>(`/admin/servers/${id}/start`, { method: 'POST' });
  }

  async adminStopServer(id: string) {
    return this.request<any>(`/admin/servers/${id}/stop`, { method: 'POST' });
  }

  async adminSuspendUser(id: string) {
    return this.request<any>(`/admin/users/${id}/suspend`, { method: 'POST' });
  }
}

export const api = new ApiClient();
