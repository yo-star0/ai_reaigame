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

// Environment variables prefixed with EXPO_PUBLIC_ are inlined at build time
// and override app.json's "extra" block. This is how the deployed build picks
// up the production API URL without source edits.
const envApiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
const envFbApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const envFbAuthDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const envFbProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const envFbAppId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

export const config = {
  apiBaseUrl:
    envApiBase?.trim() ||
    extra.apiBaseUrl ||
    'http://localhost:3000/api/v1',
  firebase: {
    apiKey: envFbApiKey ?? extra.firebaseApiKey ?? '',
    authDomain: envFbAuthDomain ?? extra.firebaseAuthDomain ?? '',
    projectId: envFbProjectId ?? extra.firebaseProjectId ?? '',
    appId: envFbAppId ?? extra.firebaseAppId ?? '',
  },
  devBypass: extra.devBypass ?? true,
};

export const isFirebaseConfigured =
  !!config.firebase.apiKey &&
  !!config.firebase.authDomain &&
  !!config.firebase.projectId;
