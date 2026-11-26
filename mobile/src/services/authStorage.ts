
import * as SecureStore from 'expo-secure-store';

// ==========================================
// STORAGE KEY
// ==========================================

const SESSION_KEY = 'smartcool_auth_tokens_v1';

// ==========================================
// TYPES
// ==========================================

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

// ==========================================
// LƯU PHIÊN ĐĂNG NHẬP
// ==========================================

export async function saveTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const tokens: StoredTokens = {
    accessToken,
    refreshToken,
  };

  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify(tokens)
  );
}

// ==========================================
// ĐỌC PHIÊN ĐĂNG NHẬP
// ==========================================

export async function getTokens():
  Promise<StoredTokens | null> {
  const saved = await SecureStore.getItemAsync(
    SESSION_KEY
  );

  if (!saved) {
    return null;
  }

  try {
    const tokens = JSON.parse(saved);

    if (
      typeof tokens?.accessToken !== 'string' ||
      typeof tokens?.refreshToken !== 'string' ||
      !tokens.accessToken ||
      !tokens.refreshToken
    ) {
      return null;
    }

    return tokens as StoredTokens;
  } catch {
    return null;
  }
}

// ==========================================
// XÓA PHIÊN ĐĂNG NHẬP
// ==========================================

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(
    SESSION_KEY
  );
}

// ==========================================
// EXPORT
// ==========================================

export const authStorage = {
  saveTokens,
  getTokens,
  clearTokens,
};

export default authStorage;
