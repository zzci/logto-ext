import { UserScope } from '@logto/react';

export interface RuntimeConfig {
  logtoEndpoint: string;
  logtoAppId: string;
  appUrl: string;
}

let _config: RuntimeConfig | null = null;

export async function loadConfig(): Promise<RuntimeConfig> {
  const resp = await fetch('/user/config.json');
  if (!resp.ok) throw new Error('Failed to load runtime config');
  _config = await resp.json();
  return _config!;
}

export function getConfig(): RuntimeConfig {
  if (!_config) throw new Error('Config not loaded. Call loadConfig() first.');
  return _config;
}

export function getLogtoConfig() {
  const config = getConfig();
  return {
    endpoint: config.logtoEndpoint,
    appId: config.logtoAppId,
    scopes: [
      UserScope.Email,
      UserScope.Phone,
      UserScope.CustomData,
      UserScope.Identities,
      UserScope.Profile,
      UserScope.Organizations,
      UserScope.Address,
    ],
  };
}

export function getAppConfig() {
  const config = getConfig();
  return {
    baseUrl: config.appUrl,
    basePath: '/user',
  };
}
