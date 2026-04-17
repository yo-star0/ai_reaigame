import { config } from './config';
import type {
  Character,
  CharacterDetail,
  MessagesPage,
  SendMessageResponse,
  User,
} from '@ai-reaigame/shared';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function createApiClient(getIdToken: () => Promise<string | null>) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getIdToken();
    const res = await fetch(`${config.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ApiError(res.status, text || res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    me: () => request<User>('/me'),
    listCharacters: () => request<Character[]>('/characters'),
    getCharacter: (id: string) => request<CharacterDetail>(`/characters/${id}`),
    completeOpening: (id: string) =>
      request<{ ok: true }>(`/characters/${id}/opening/complete`, { method: 'POST' }),
    listMessages: (id: string, cursor?: string) =>
      request<MessagesPage>(
        `/characters/${id}/messages${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
      ),
    sendMessage: (id: string, content: string) =>
      request<SendMessageResponse>(`/characters/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
