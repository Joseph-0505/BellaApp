import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "appbella.refresh-token";
let pendingWrite = Promise.resolve();

export async function readRefreshToken() {
  if (Platform.OS === "web") return null;
  await pendingWrite;
  return SecureStore.getItemAsync(KEY);
}

export function persistRefreshToken(token: string | null) {
  if (Platform.OS === "web") return Promise.resolve();
  pendingWrite = pendingWrite.catch(() => {}).then(async () => {
    if (token) {
      await SecureStore.setItemAsync(KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  });
  return pendingWrite;
}
