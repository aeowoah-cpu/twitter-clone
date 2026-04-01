const config = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY ?? 'AIzaSyCLJlW4kgIKDd01fKILv47LPcjCuD8pO9s',
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN ?? 'mhhhhh-2963e.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? 'mhhhhh-2963e',
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'mhhhhh-2963e.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID ?? '484170424937',
  appId: process.env.NEXT_PUBLIC_APP_ID ?? '1:484170424937:web:77a0e155cf5b680fd638f8',
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID ?? 'G-T9GSWMQHDG'
} as const;

type Config = typeof config;

export function getFirebaseConfig(): Config {
  return config;
}
