import * as SecureStore from 'expo-secure-store';

const KEY = 'viadeep.accessToken';

/** El JWT se guarda cifrado en el Keystore de Android, nunca en AsyncStorage. */
export const tokenStorage = {
  read: () => SecureStore.getItemAsync(KEY),
  save: (token: string) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
