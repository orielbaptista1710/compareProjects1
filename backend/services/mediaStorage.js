// services/mediaStorage.js
//
// Cloudflare R2 storage for files posters upload with a listing. The browser
// uploads straight to R2 with a short-lived signed link from presignUpload();
// file bytes never pass through this server.
//
// Off unless ENABLE_MEDIA_UPLOAD=true and every R2_* variable is set.
//
// R2 speaks the S3 API, so links are signed with AWS Signature Version 4
// (query-string form) using node:crypto. R2 has no form-upload policy, so the
// size and type limits are enforced two ways: the signed link only accepts the
// exact Content-Type and Content-Length it was issued for, and
// services/listingMedia.js checks the stored file again when the listing is saved.
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { FILE_EXTENSIONS, UPLOAD_URL_TTL_SECONDS } from '../constants/media.js';

const HEAD_TIMEOUT_MS = 5000;

const readConfig = (env = process.env) => {
  if (env.ENABLE_MEDIA_UPLOAD !== 'true') return null;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_BASE_URL) {
    return null;
  }
  return {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: R2_BUCKET,
    publicBase: R2_PUBLIC_BASE_URL.replace(/\/+$/, ''),
  };
};

export const isMediaStorageEnabled = () => readConfig() !== null;

/** Host that serves uploaded files to buyers (e.g. "media.example.com"), or null when off. */
export const mediaPublicHost = () => {
  const config = readConfig();
  return config ? new URL(config.publicBase).hostname : null;
};

// ── Keys ────────────────────────────────────────────────────────────────────
// listings/<customer|user>/<account id>/<random>-<kind>.<ext>
// The name is always made here, never taken from the client.
export const ownerKeyPrefix = (owner) => `listings/${String(owner.model).toLowerCase()}/${owner.id}/`;

export const newObjectKey = (owner, kind, contentType) =>
  `${ownerKeyPrefix(owner)}${randomUUID()}-${kind}.${FILE_EXTENSIONS[contentType]}`;

export const publicUrlFor = (key) => `${readConfig().publicBase}/${key}`;

/** The storage key behind one of our public URLs, or null for any other URL. */
export const keyFromPublicUrl = (url) => {
  const config = readConfig();
  if (!config || typeof url !== 'string') return null;
  const base = `${config.publicBase}/`;
  if (!url.startsWith(base)) return null;
  const key = url.slice(base.length);
  // Our keys are plain; anything with a query, fragment, "..", or an encoded
  // character is not one of them.
  return /^[a-z0-9/._-]+$/i.test(key) && !key.includes('..') ? key : null;
};

// ── AWS Signature V4, query-string form ─────────────────────────────────────
const sha256Hex = (value) => createHash('sha256').update(value).digest('hex');
const hmac = (key, value) => createHmac('sha256', key).update(value).digest();
// RFC 3986: everything except A-Z a-z 0-9 - _ . ~
const rfc3986 = (value) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * A URL that lets its holder make exactly one kind of request until it expires.
 * `headers` are part of the signature: the request must send the same values.
 * Exported for the unit test against AWS's published example.
 */
export const presignUrl = ({
  method,
  url,
  headers = {},
  accessKeyId,
  secretAccessKey,
  region = 'auto',
  expiresIn = UPLOAD_URL_TTL_SECONDS,
  now = new Date(),
}) => {
  const target = new URL(url);
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, ''); // 20130524T000000Z
  const scope = `${amzDate.slice(0, 8)}/${region}/s3/aws4_request`;

  const signed = { host: target.host };
  for (const [name, value] of Object.entries(headers)) signed[name.toLowerCase()] = String(value).trim();
  const headerNames = Object.keys(signed).sort();

  const query = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': headerNames.join(';'),
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${rfc3986(name)}=${rfc3986(query[name])}`)
    .join('&');
  const canonicalPath = target.pathname
    .split('/')
    .map((part) => rfc3986(decodeURIComponent(part)))
    .join('/');

  const canonicalRequest = [
    method,
    canonicalPath,
    canonicalQuery,
    ...headerNames.map((name) => `${name}:${signed[name]}`),
    '',
    headerNames.join(';'),
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  const signingKey = ['s3', 'aws4_request'].reduce(
    hmac,
    hmac(hmac(`AWS4${secretAccessKey}`, amzDate.slice(0, 8)), region)
  );
  const signature = hmac(signingKey, stringToSign).toString('hex');

  return `${target.origin}${canonicalPath}?${canonicalQuery}&X-Amz-Signature=${signature}`;
};

const objectUrl = (config, key) => `${config.endpoint}/${config.bucket}/${key}`;

/**
 * Link the browser PUTs one file to. It only works for this key, this
 * Content-Type and this exact size, for UPLOAD_URL_TTL_SECONDS, and only once:
 * "If-None-Match: *" makes R2 refuse to overwrite a stored file (412), so the
 * file can't be swapped after the listing was saved or reviewed.
 *
 * Returns the link and the headers the browser must send with it (the browser
 * adds Content-Length itself).
 */
export const presignUpload = ({ key, contentType, size }) => {
  const config = readConfig();
  const headers = { 'Content-Type': contentType, 'If-None-Match': '*' };
  const uploadUrl = presignUrl({
    method: 'PUT',
    url: objectUrl(config, key),
    headers: { ...headers, 'content-length': size },
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });
  return { uploadUrl, headers };
};

/**
 * Size and type of a stored file, or null when nothing is stored under `key`.
 * Throws when R2 can't be reached or answers with another error.
 */
export const headObject = async (key) => {
  const config = readConfig();
  const url = presignUrl({
    method: 'HEAD',
    url: objectUrl(config, key),
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    expiresIn: 60,
  });
  const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(HEAD_TIMEOUT_MS) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Media storage answered ${res.status}`);
  return {
    size: Number(res.headers.get('content-length')),
    contentType: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(),
  };
};
