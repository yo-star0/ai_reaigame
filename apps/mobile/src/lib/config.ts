import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  devBypass: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

export const config = {
  apiBaseUrl: extra.apiBaseUrl ?? 'http://localhost:3000/api/v1',
  firebase: {
    apiKey: extra.firebaseApiKey ?? '',
    authDomain: extra.firebaseAuthDomain ?? '',
    projectId: extra.firebaseProjectId ?? '',
    appId: extra.firebaseAppId ?? '',
  },
  devBypass: extra.devBypass ?? false,
};

export const isFirebaseConfigured =
  !!config.firebase.apiKey &&
  !!config.firebase.authDomain &&
  !!config.firebase.projectId;
