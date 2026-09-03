import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

interface CachedSecret {
  value: string;
  source: 'Google Cloud Secret Manager' | 'Environment Variable';
  cachedAt: number;
}

let memorySecretCache: CachedSecret | null = null;
let secretClient: SecretManagerServiceClient | null = null;

/**
 * Returns an instance of the Google Cloud Secret Manager client (lazy loaded)
 */
function getSecretClient(): SecretManagerServiceClient {
  if (!secretClient) {
    secretClient = new SecretManagerServiceClient();
  }
  return secretClient;
}

/**
 * Retrieves the Gemini API Key dynamically from Google Cloud Secret Manager
 * with in-memory caching across container warm starts.
 */
export async function getGeminiApiKey(): Promise<{
  apiKey: string;
  source: 'Google Cloud Secret Manager' | 'Environment Variable';
  isCached: boolean;
}> {
  // Check in-memory cache first (valid for process lifetime / container warm start)
  if (memorySecretCache && memorySecretCache.value) {
    return {
      apiKey: memorySecretCache.value,
      source: memorySecretCache.source,
      isCached: true,
    };
  }

  // Attempt Google Cloud Secret Manager access if in GCP runtime
  const secretName = process.env.GEMINI_SECRET_NAME || 'GEMINI_API_KEY';
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

  if (projectId) {
    try {
      const client = getSecretClient();
      const formattedName = client.secretVersionPath(projectId, secretName, 'latest');
      const [version] = await client.accessSecretVersion({ name: formattedName });
      
      const payload = version.payload?.data?.toString();
      if (payload && payload.trim().length > 0) {
        memorySecretCache = {
          value: payload.trim(),
          source: 'Google Cloud Secret Manager',
          cachedAt: Date.now(),
        };
        return {
          apiKey: memorySecretCache.value,
          source: 'Google Cloud Secret Manager',
          isCached: false,
        };
      }
    } catch {
      // Secret Manager API unconfigured or disabled in development sandbox; cleanly fall back to environment secret
    }
  }

  // Fallback to process.env.GEMINI_API_KEY (used in AI Studio sandbox and local dev)
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    memorySecretCache = {
      value: envKey.trim(),
      source: 'Environment Variable',
      cachedAt: Date.now(),
    };
    return {
      apiKey: memorySecretCache.value,
      source: 'Environment Variable',
      isCached: false,
    };
  }

  // Graceful autonomous fallback if API key is not yet set in production environment
  return {
    apiKey: '',
    source: 'Environment Variable',
    isCached: false,
  };
}

/**
 * Utility to clear the in-memory secret cache for testing/rotation
 */
export function invalidateSecretCache(): void {
  memorySecretCache = null;
}
