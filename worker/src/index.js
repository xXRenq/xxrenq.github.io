const ALLOWED_TOOL_IDS = new Set(["python-gartic-tool"]);
const KEY_TTL_MS = 10 * 60 * 1000;
const WEB_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const TOOL_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PASSWORD_ITERATIONS = 100000;
const encoder = new TextEncoder();

class ApiError extends Error {
  constructor(status, message, headers = {}) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof ApiError) {
        return json(request, env, { error: error.message }, error.status, error.headers);
      }
      console.error("Access API error", error);
      return json(request, env, { error: "Internal server error." }, 500);
    }
  },
  async scheduled(_controller, env, context) {
    const now = Date.now();
    context.waitUntil(Promise.all([
      env.DB.prepare(
        "UPDATE access_keys SET status = 'expired' WHERE status = 'active' AND expires_at <= ?",
      ).bind(now).run(),
      env.DB.prepare(
        "DELETE FROM rate_limits WHERE window_start < ?",
      ).bind(now - 48 * 60 * 60 * 1000).run(),
      env.DB.prepare(
        "DELETE FROM web_sessions WHERE expires_at < ? OR revoked_at < ?",
      ).bind(now - 30 * 24 * 60 * 60 * 1000, now - 30 * 24 * 60 * 60 * 1000).run(),
      env.DB.prepare(
        "DELETE FROM tool_sessions WHERE expires_at < ? OR revoked_at < ?",
      ).bind(now - 30 * 24 * 60 * 60 * 1000, now - 30 * 24 * 60 * 60 * 1000).run(),
    ]));
  },
};

async function route(request, env) {
  const origin = request.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin, env)) {
    throw new ApiError(403, "Origin not allowed.");
  }

  if (request.method === "OPTIONS") {
    return json(request, env, {}, 204);
  }

  const url = new URL(request.url);
  if (url.pathname === "/api/health" && request.method === "GET") {
    return json(request, env, { ok: true });
  }

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    return register(request, env);
  }
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    return login(request, env);
  }
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    return logout(request, env);
  }
  if (url.pathname === "/api/me" && request.method === "GET") {
    return getMe(request, env);
  }
  if (url.pathname === "/api/generator/code" && request.method === "POST") {
    return createGeneratorCode(request, env);
  }
  if (url.pathname === "/api/generator/connect" && request.method === "POST") {
    return connectGenerator(request, env);
  }
  if (url.pathname === "/api/generator/session" && request.method === "DELETE") {
    return revokeGeneratorSession(request, env);
  }
  if (url.pathname === "/api/keys" && request.method === "GET") {
    return listKeys(request, env);
  }
  if (url.pathname === "/api/keys" && request.method === "POST") {
    return createKey(request, env);
  }
  if (url.pathname.startsWith("/api/keys/") && request.method === "DELETE") {
    return revokeKey(request, env, url.pathname.slice("/api/keys/".length));
  }
  if (url.pathname === "/api/tools/exchange" && request.method === "POST") {
    return exchangeKey(request, env);
  }
  if (url.pathname === "/api/tools/verify" && request.method === "POST") {
    return verifyToolSession(request, env);
  }
  if (url.pathname === "/api/tools/logout" && request.method === "POST") {
    return logoutToolSession(request, env);
  }

  throw new ApiError(404, "Endpoint not found.");
}

async function register(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidEmail(email)) throw new ApiError(400, "Enter a valid email address.");
  if (password.length < 12 || password.length > 128) {
    throw new ApiError(400, "Password must be between 12 and 128 characters.");
  }
  await limitByIp(request, env, "register", 5, 60 * 60 * 1000);

  const existing = await env.DB.prepare("SELECT id FROM accounts WHERE email = ?")
    .bind(email)
    .first();
  if (existing) throw new ApiError(409, "An account with that email already exists.");

  const now = Date.now();
  const salt = randomToken("", 16);
  const passwordHash = await derivePassword(password, salt);
  const accountId = randomToken("acct_", 16);
  await env.DB.prepare(
    "INSERT INTO accounts (id, email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(accountId, email, salt, passwordHash, now)
    .run();

  const session = await createWebSession(env, accountId, now);
  return json(request, env, {
    token: session.token,
    expiresAt: session.expiresAt,
    account: { id: accountId, email },
  }, 201);
}

async function login(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  await limitByIp(request, env, "login", 10, 15 * 60 * 1000);
  await limitByAccount(env, email, "login-email", 12, 15 * 60 * 1000);

  const account = await env.DB.prepare(
    "SELECT id, email, password_salt, password_hash, disabled_at FROM accounts WHERE email = ?",
  )
    .bind(email)
    .first();
  const salt = account?.password_salt ?? "AAAAAAAAAAAAAAAAAAAAAA";
  const candidateHash = await derivePassword(password.slice(0, 128), salt);
  if (!account || account.disabled_at || !constantTimeEqual(candidateHash, account.password_hash)) {
    throw new ApiError(401, "Email or password is incorrect.");
  }

  const session = await createWebSession(env, account.id, Date.now());
  return json(request, env, {
    token: session.token,
    expiresAt: session.expiresAt,
    account: { id: account.id, email: account.email },
  });
}

async function logout(request, env) {
  const session = await requireAccount(request, env);
  await env.DB.prepare("UPDATE web_sessions SET revoked_at = ? WHERE token_hash = ?")
    .bind(Date.now(), session.tokenHash)
    .run();
  return json(request, env, { ok: true });
}

async function getMe(request, env) {
  const session = await requireAccount(request, env);
  return json(request, env, {
    account: { id: session.account_id, email: session.email },
    expiresAt: session.expires_at,
  });
}

async function createKey(request, env) {
  const generatorSession = await requireGeneratorSession(request, env);
  const body = await readJson(request);
  const toolId = typeof body.toolId === "string" ? body.toolId : "";
  if (!ALLOWED_TOOL_IDS.has(toolId)) throw new ApiError(400, "Tool is not supported.");

  await limitByIp(request, env, "key-create-hour", 3, 60 * 60 * 1000);
  await limitByIp(request, env, "key-create-day", 10, 24 * 60 * 60 * 1000);
  await limitByAccount(env, generatorSession.account_id, "key-create-hour", 3, 60 * 60 * 1000);
  await limitByAccount(env, generatorSession.account_id, "key-create-day", 10, 24 * 60 * 60 * 1000);

  const now = Date.now();
  await env.DB.prepare(
    "UPDATE access_keys SET status = 'expired' WHERE status = 'active' AND expires_at <= ?",
  )
    .bind(now)
    .run();

  const key = randomToken("xxt_", 32);
  const keyHash = await sha256(key);
  const expiresAt = now + KEY_TTL_MS;
  await env.DB.prepare(
    `INSERT INTO access_keys
       (key_hash, account_id, tool_id, created_at, expires_at, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
  )
    .bind(keyHash, generatorSession.account_id, toolId, now, expiresAt)
    .run();

  return json(request, env, {
    key,
    keyId: keyHash.slice(0, 16),
    toolId,
    createdAt: now,
    expiresAt,
    status: "active",
    uses: 0,
  }, 201);
}

async function listKeys(request, env) {
  const generatorSession = await requireGeneratorSession(request, env);
  const now = Date.now();
  await env.DB.prepare(
    `UPDATE access_keys SET status = 'expired'
       WHERE account_id = ? AND status = 'active' AND expires_at <= ?`,
  )
    .bind(generatorSession.account_id, now)
    .run();

  const result = await env.DB.prepare(
        `SELECT substr(access_keys.key_hash, 1, 16) AS id, tool_id, created_at, expires_at,
          status, used_at, use_count AS uses, last_used_at, client_version,
          COALESCE((SELECT SUM(request_count) FROM tool_sessions
              WHERE tool_sessions.key_hash = access_keys.key_hash), 0) AS tool_requests
           FROM access_keys WHERE account_id = ?
           ORDER BY created_at DESC LIMIT 100`,
  )
         .bind(generatorSession.account_id)
    .all();
  return json(request, env, { keys: result.results });
}

async function revokeKey(request, env, keyId) {
  const generatorSession = await requireGeneratorSession(request, env);
  if (!/^[a-f0-9]{16}$/.test(keyId)) throw new ApiError(404, "Key not found.");
  const result = await env.DB.prepare(
    `UPDATE access_keys SET status = 'revoked', revoked_at = ?
       WHERE substr(key_hash, 1, 16) = ? AND account_id = ? AND status = 'active'`,
  )
    .bind(Date.now(), keyId, generatorSession.account_id)
    .run();
  if (result.meta.changes !== 1) throw new ApiError(404, "Active key not found.");
  return json(request, env, { ok: true });
}

async function exchangeKey(request, env) {
  await limitByIp(request, env, "key-exchange", 30, 5 * 60 * 1000);
  const body = await readJson(request);
  const key = typeof body.key === "string" ? body.key : "";
  const toolId = typeof body.toolId === "string" ? body.toolId : "";
  const clientVersion = typeof body.clientVersion === "string"
    ? body.clientVersion.slice(0, 40)
    : null;
  if (!/^xxt_[A-Za-z0-9_-]{43}$/.test(key) || !ALLOWED_TOOL_IDS.has(toolId)) {
    throw new ApiError(401, "Key is invalid, expired, or already used.");
  }

  const now = Date.now();
  const keyHash = await sha256(key);
  const exchangeId = randomToken("", 16);
  const token = randomToken("tool_", 32);
  const tokenHash = await sha256(token);
  const expiresAt = now + TOOL_SESSION_TTL_MS;

  // D1 batches execute transactionally; only the first exchange can move an active key to used.
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE access_keys
          SET status = 'used', used_at = ?, last_used_at = ?, use_count = use_count + 1,
              client_version = ?, exchange_id = ?
        WHERE key_hash = ? AND tool_id = ? AND status = 'active' AND expires_at > ?`,
    ).bind(now, now, clientVersion, exchangeId, keyHash, toolId, now),
    env.DB.prepare(
      `INSERT INTO tool_sessions (token_hash, key_hash, account_id, tool_id, issued_at, expires_at)
       SELECT ?, key_hash, account_id, tool_id, ?, ? FROM access_keys
        WHERE key_hash = ? AND exchange_id = ? AND status = 'used'`,
    ).bind(tokenHash, now, expiresAt, keyHash, exchangeId),
    env.DB.prepare(
      "UPDATE access_keys SET exchange_id = NULL WHERE key_hash = ? AND exchange_id = ?",
    ).bind(keyHash, exchangeId),
  ]);

  if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) {
    await env.DB.prepare(
      "UPDATE access_keys SET status = 'expired' WHERE key_hash = ? AND status = 'active' AND expires_at <= ?",
    )
      .bind(keyHash, now)
      .run();
    throw new ApiError(401, "Key is invalid, expired, or already used.");
  }

  return json(request, env, { valid: true, token, toolId, expiresAt });
}

async function verifyToolSession(request, env) {
  const body = await readJson(request);
  const toolId = typeof body.toolId === "string" ? body.toolId : "";
  if (!ALLOWED_TOOL_IDS.has(toolId)) throw new ApiError(403, "Tool is not authorized.");
  const token = bearerToken(request);
  if (!token) throw new ApiError(401, "Tool session is invalid.");

  if (token.startsWith("sess_")) {
    const accountSession = await requireAccount(request, env);
    await limitByIp(request, env, "tool-verify", 120, 5 * 60 * 1000);
    await limitByAccount(env, accountSession.account_id, "account-session-verify", 120, 60 * 1000);
    return json(request, env, {
      valid: true,
      toolId,
      expiresAt: accountSession.expires_at,
      authMethod: "account",
    });
  }
  if (!token.startsWith("tool_")) throw new ApiError(401, "Tool session is invalid.");

  const now = Date.now();
  const tokenHash = await sha256(token);
  await limitByIp(request, env, "tool-verify", 120, 5 * 60 * 1000);
  await limitByAccount(env, tokenHash, "tool-session-verify", 120, 60 * 1000);
  const session = await env.DB.prepare(
    `UPDATE tool_sessions SET request_count = request_count + 1, last_seen_at = ?
      WHERE token_hash = ? AND tool_id = ? AND revoked_at IS NULL AND expires_at > ?
      RETURNING tool_id, expires_at, request_count`,
  )
    .bind(now, tokenHash, toolId, now)
    .first();
  if (!session) throw new ApiError(401, "Tool session is invalid or expired.");
  return json(request, env, {
    valid: true,
    toolId: session.tool_id,
    expiresAt: session.expires_at,
    requests: session.request_count,
  });
}

async function createWebSession(env, accountId, now) {
  const token = randomToken("sess_", 32);
  const tokenHash = await sha256(token);
  const expiresAt = now + WEB_SESSION_TTL_MS;
  await env.DB.prepare(
    "INSERT INTO web_sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  )
    .bind(tokenHash, accountId, now, expiresAt)
    .run();
  return { token, tokenHash, expiresAt };
}

async function requireAccount(request, env) {
  const token = bearerToken(request);
  if (!token || !token.startsWith("sess_")) throw new ApiError(401, "Please sign in.");
  const tokenHash = await sha256(token);
  const session = await env.DB.prepare(
    `SELECT web_sessions.token_hash, web_sessions.account_id, web_sessions.expires_at,
            accounts.email
       FROM web_sessions JOIN accounts ON accounts.id = web_sessions.account_id
      WHERE web_sessions.token_hash = ? AND web_sessions.revoked_at IS NULL
        AND web_sessions.expires_at > ? AND accounts.disabled_at IS NULL`,
  )
    .bind(tokenHash, Date.now())
    .first();
  if (!session) throw new ApiError(401, "Session expired. Please sign in again.");
  return session;
}

async function limitByIp(request, env, purpose, limit, windowMs) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  await applyRateLimit(env, `ip:${purpose}`, ip, limit, windowMs);
}

async function limitByAccount(env, accountId, purpose, limit, windowMs) {
  await applyRateLimit(env, `account:${purpose}`, accountId, limit, windowMs);
}

async function applyRateLimit(env, category, actor, limit, windowMs) {
  const pepper = env.RATE_LIMIT_PEPPER ||
    (env.ENVIRONMENT === "development" ? "local-development-only" : "");
  if (!pepper) throw new Error("RATE_LIMIT_PEPPER is not configured.");
  const bucketKey = await sha256(`${pepper}:${category}:${actor}`);
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket_key, window_start, hits) VALUES (?, ?, 1)
     ON CONFLICT(bucket_key, window_start) DO UPDATE SET hits = hits + 1 RETURNING hits`,
  )
    .bind(bucketKey, windowStart)
    .first();
  if (row.hits > limit) {
    const retryAfter = Math.ceil((windowStart + windowMs - Date.now()) / 1000);
    throw new ApiError(429, "Too many requests. Try again later.", { "Retry-After": String(retryAfter) });
  }
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 8192) throw new ApiError(413, "Request is too large.");
  if (!request.body) throw new ApiError(400, "Invalid JSON body.");

  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) {
        await reader.cancel();
        throw new ApiError(413, "Request is too large.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid body");
    return value;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Invalid JSON body.");
  }
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function bearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(authorization);
  return match?.[1] ?? "";
}

function randomToken(prefix, byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return prefix + toBase64Url(bytes);
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function derivePassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromBase64Url(salt), iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64Url(new Uint8Array(bits));
}

function constantTimeEqual(left, right = "") {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function isAllowedOrigin(origin, env) {
  return origin === env.ALLOWED_ORIGIN ||
    (env.ENVIRONMENT === "development" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
}

function json(request, env, value, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = request.headers.get("Origin");
  if (origin && isAllowedOrigin(origin, env)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Max-Age", "600");
    headers.set("Vary", "Origin");
  }
  for (const [name, headerValue] of Object.entries(extraHeaders)) headers.set(name, headerValue);
  return new Response(status === 204 ? null : JSON.stringify(value), { status, headers });
}

async function createGeneratorCode(request, env) {
  const accountSession = await requireAccount(request, env);
  await limitByIp(request, env, "generator-code", 10, 60 * 60 * 1000);
  await limitByAccount(env, accountSession.account_id, "generator-code", 5, 60 * 60 * 1000);

  const code = `link_${randomToken("", 6)}`;
  const codeHash = await sha256(code);
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000;
  await env.DB.prepare(
    "INSERT INTO generator_links (code_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  )
    .bind(codeHash, accountSession.account_id, now, expiresAt)
    .run();
  return json(request, env, { code, expiresAt });
}

async function connectGenerator(request, env) {
  await limitByIp(request, env, "generator-connect", 20, 5 * 60 * 1000);
  const body = await readJson(request);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!/^link_[A-Za-z0-9_-]{8}$/.test(code)) {
    throw new ApiError(401, "Pairing code is invalid or expired.");
  }

  const now = Date.now();
  const codeHash = await sha256(code);
  const exchangeId = randomToken("", 12);
  const token = randomToken("owner_", 32);
  const tokenHash = await sha256(token);
  const expiresAt = now + 12 * 60 * 60 * 1000;
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE generator_links SET used_at = ?, exchange_id = ?
        WHERE code_hash = ? AND used_at IS NULL AND expires_at > ?`,
    ).bind(now, exchangeId, codeHash, now),
    env.DB.prepare(
      `INSERT INTO generator_sessions (token_hash, account_id, created_at, expires_at)
       SELECT ?, account_id, ?, ? FROM generator_links
        WHERE code_hash = ? AND exchange_id = ? AND used_at = ?`,
    ).bind(tokenHash, now, expiresAt, codeHash, exchangeId, now),
    env.DB.prepare(
      "UPDATE generator_links SET exchange_id = NULL WHERE code_hash = ? AND exchange_id = ?",
    ).bind(codeHash, exchangeId),
  ]);
  if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) {
    throw new ApiError(401, "Pairing code is invalid or expired.");
  }
  return json(request, env, { token, expiresAt });
}

async function requireGeneratorSession(request, env) {
  const token = bearerToken(request);
  if (!token.startsWith("owner_")) throw new ApiError(401, "Connect this generator from AutoDraw first.");
  const tokenHash = await sha256(token);
  const session = await env.DB.prepare(
    `SELECT token_hash, account_id, expires_at FROM generator_sessions
      WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?`,
  )
    .bind(tokenHash, Date.now())
    .first();
  if (!session) throw new ApiError(401, "Generator session expired. Connect it again from AutoDraw.");
  return session;
}

async function revokeGeneratorSession(request, env) {
  const session = await requireGeneratorSession(request, env);
  await env.DB.prepare("UPDATE generator_sessions SET revoked_at = ? WHERE token_hash = ?")
    .bind(Date.now(), session.token_hash)
    .run();
  return json(request, env, { ok: true });
}

async function logoutToolSession(request, env) {
  const token = bearerToken(request);
  if (token.startsWith("sess_")) return logout(request, env);
  if (!token.startsWith("tool_")) throw new ApiError(401, "Tool session is invalid.");
  const tokenHash = await sha256(token);
  const result = await env.DB.prepare(
    "UPDATE tool_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
  )
    .bind(Date.now(), tokenHash)
    .run();
  if (result.meta.changes !== 1) throw new ApiError(401, "Tool session is invalid.");
  return json(request, env, { ok: true });
}