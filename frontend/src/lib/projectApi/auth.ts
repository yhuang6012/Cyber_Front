import { getProjectBaseUrl } from './utils';

/**
 * 登录接口：调用项目后台换取 Token。
 *
 * 默认路径为 `/api/auth/token`，如后端不同可通过 `VITE_AUTH_LOGIN_PATH` 覆盖。
 * 使用 OAuth2 password flow，`application/x-www-form-urlencoded`。
 */
export async function loginWithPassword(params: {
  username: string;
  password: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}): Promise<{ token: string; username: string; role?: string | null; raw: any }> {
  const base = getProjectBaseUrl();
  const path =
    (import.meta as any).env?.VITE_AUTH_LOGIN_PATH || '/api/auth/token';
  const url = `${base}${path}`;

  console.log('[projectApi] login POST', url, { username: params.username, scope: params.scope, client_id: params.client_id });

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: params.username,
      password: params.password,
      ...(params.scope ? { scope: params.scope } : {}),
      ...(params.client_id ? { client_id: params.client_id } : {}),
      ...(params.client_secret ? { client_secret: params.client_secret } : {}),
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `登录失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  const data: any = await resp.json();
  const token: string | undefined = data.token ?? data.access_token;

  if (!token) {
    throw new Error('登录接口返回中缺少 token 字段');
  }

  return {
    token,
    username: data.username ?? params.username,
    role: data.role ?? null,
    raw: data,
  };
}
