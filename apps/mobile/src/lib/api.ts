import { config } from './config';
import type {
  Character,
  CharacterDetail,
  MessagesPage,
  ScenarioCompleteRequest,
  ScenarioCreate,
  ScenarioDetail,
  ScenarioSummary,
  ScenarioUpdate,
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
    me: () => request<User & { isAdmin: boolean }>('/me'),
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

    listScenariosForCharacter: (characterId: string) =>
      request<ScenarioSummary[]>(`/characters/${characterId}/scenarios`),
    getScenario: (slug: string) => request<ScenarioDetail>(`/scenarios/${slug}`),
    completeScenario: (slug: string, payload: ScenarioCompleteRequest) =>
      request<{ ok: true; affinity: number; affinityDelta: number }>(
        `/scenarios/${slug}/complete`,
        { method: 'POST', body: JSON.stringify(payload) },
      ),

    adminListScenarios: () => request<ScenarioSummary[]>('/admin/scenarios'),
    adminGetScenario: (id: string) => request<ScenarioDetail>(`/admin/scenarios/${id}`),
    adminCreateScenario: (payload: ScenarioCreate) =>
      request<ScenarioDetail>('/admin/scenarios', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    adminUpdateScenario: (id: string, payload: ScenarioUpdate) =>
      request<ScenarioDetail>(`/admin/scenarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    adminDeleteScenario: (id: string) =>
      request<{ ok: true }>(`/admin/scenarios/${id}`, { method: 'DELETE' }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
