/**
 * Object storage helpers for uploading files and getting download URLs.
 * Uses the loadConfig from core-infrastructure to get storage configuration,
 * then calls the Caffeine storage gateway API directly.
 */
import { loadConfig } from "@caffeineai/core-infrastructure";

const MOTOKO_DEDUPLICATION_SENTINEL = "!caf!";
const GATEWAY_VERSION = "v1";

/**
 * Compute SHA-256 hash of bytes using the Web Crypto API.
 * Returns the hash as a hex string.
 */
async function sha256Hex(data: Uint8Array<ArrayBuffer>): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Upload a file to Caffeine object storage using StorageClient from core-infrastructure.
 * Uses dynamic import to access the transitive dependency.
 * Returns the file ID string (in the format stored by the backend).
 */
export async function uploadFileToStorage(
  bytes: Uint8Array,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const config = await loadConfig();

  // Dynamic import of @caffeineai/object-storage (transitive dep of core-infrastructure)
  // The package is available in pnpm virtual store but has no standalone type declarations
  // in the frontend's node_modules, so we use a typed function wrapper.
  type StorageClientType = {
    putFile: (
      b: Uint8Array,
      p?: (pct: number) => void,
    ) => Promise<{ hash: string }>;
  };
  type StorageClientCtor = new (...args: unknown[]) => StorageClientType;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStorageClient = new Function(
    "return import('@caffeineai/object-storage')",
  ) as () => Promise<{ StorageClient: StorageClientCtor }>;

  const { StorageClient } = await getStorageClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { HttpAgent } = (await import("@icp-sdk/core/agent")) as any;
  const agent = await HttpAgent.createSync({
    host: config.backend_host ?? "https://icp-api.io",
  });

  const client = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );

  const { hash } = await client.putFile(bytes, onProgress);
  return MOTOKO_DEDUPLICATION_SENTINEL + hash;
}

/**
 * Get a direct download URL for a file ID previously returned by uploadFileToStorage.
 * Constructs the URL using the storage gateway config — no network call required.
 */
export async function getFileUrl(fileId: string): Promise<string> {
  const config = await loadConfig();

  const hash = fileId.startsWith(MOTOKO_DEDUPLICATION_SENTINEL)
    ? fileId.substring(MOTOKO_DEDUPLICATION_SENTINEL.length)
    : fileId;

  const baseUrl = config.storage_gateway_url.endsWith("/")
    ? config.storage_gateway_url.slice(0, -1)
    : config.storage_gateway_url;

  return (
    `${baseUrl}/${GATEWAY_VERSION}/blob/` +
    `?blob_hash=${encodeURIComponent(hash)}` +
    `&owner_id=${encodeURIComponent(config.backend_canister_id)}` +
    `&project_id=${encodeURIComponent(config.project_id)}`
  );
}

// sha256Hex is defined but used only for future reference; suppress unused warning
void sha256Hex;
