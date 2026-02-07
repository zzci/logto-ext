import { UserScope } from '@logto/react';

export const logtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
  appId: import.meta.env.VITE_LOGTO_APP_ID,
  scopes: [
    UserScope.Email,
    UserScope.Phone,
    UserScope.CustomData,
    UserScope.Identities,
    UserScope.Profile,
    UserScope.Organizations,
    UserScope.Address,
  ],
  // Don't specify resources - Account API uses opaque tokens
};

export const appConfig = {
  baseUrl: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  basePath: '/user',
};
