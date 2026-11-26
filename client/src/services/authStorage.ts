
// ==========================================
// STORAGE KEY
// ==========================================

const SESSION_KEY = 'smartcool_web_auth_tokens_v1';

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

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(tokens)
  );
}

// ==========================================
// ĐỌC PHIÊN ĐĂNG NHẬP
// ==========================================

export async function getTokens():
  Promise<StoredTokens | null> {
  const saved = sessionStorage.getItem(
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
      await clearTokens();

      return null;
    }

    return tokens as StoredTokens;
  } catch {
    await clearTokens();

    return null;
  }
}

// ==========================================
// XÓA PHIÊN ĐĂNG NHẬP
// ==========================================

export async function clearTokens():
  Promise<void> {
  sessionStorage.removeItem(
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
