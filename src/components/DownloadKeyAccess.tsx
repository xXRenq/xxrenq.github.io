import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  Copy,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { accessApi, type AccessKey, type IssuedKey } from "../lib/accessApi";

type DownloadKeyAccessProps = {
  toolId: string;
  toolName: string;
};

export function DownloadKeyAccess({ toolId, toolName }: DownloadKeyAccessProps) {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [issuedKey, setIssuedKey] = useState<IssuedKey | null>(null);
  const [generatorToken, setGeneratorToken] = useState<string | null>(() => accessApi.getManagementToken());
  const [pairingCode, setPairingCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const token = accessApi.getManagementToken();
    if (!accessApi.isConfigured || !token) {
      const timer = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timer);
    }

    let mounted = true;
    void (async () => {
      try {
        const history = await accessApi.keys(token);
        if (!mounted) return;
        setKeys(history.keys);
      } catch {
        accessApi.clearManagementToken();
        if (mounted) setGeneratorToken(null);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function refreshKeys(token: string) {
    const history = await accessApi.keys(token);
    setKeys(history.keys);
  }

  async function connectGenerator(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await accessApi.connectGenerator(pairingCode);
      accessApi.saveManagementToken(result.token);
      setGeneratorToken(result.token);
      setPairingCode("");
      await refreshKeys(result.token);
      setNotice("This generator is connected to your AutoDraw account.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGenerator() {
    const token = generatorToken;
    if (!token) return;
    setBusy(true);
    try {
      await accessApi.disconnectGenerator(token);
    } catch {
      // Clear the local session even if the server session already expired.
    }
    accessApi.clearManagementToken();
    setGeneratorToken(null);
    setKeys([]);
    setIssuedKey(null);
    setNotice("Generator disconnected.");
    setBusy(false);
  }

  async function generateKey() {
    const token = generatorToken;
    if (!token) return;
    setBusy(true);
    setError("");
    setNotice("");
    setIssuedKey(null);
    try {
      const result = await accessApi.generateKey(token, toolId);
      setIssuedKey(result);
      setNotice("Key generated. Copy it now; it will only be shown once.");
      await refreshKeys(token);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function copyIssuedKey() {
    if (!issuedKey) return;
    try {
      await navigator.clipboard.writeText(issuedKey.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access is unavailable. Select and copy the key manually.");
    }
  }

  async function revokeKey(keyId: string) {
    const token = accessApi.getManagementToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await accessApi.revokeKey(token, keyId);
      await refreshKeys(token);
      setNotice("Key revoked.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="key-access-shell" aria-labelledby="key-access-heading">
      <div className="key-snow" aria-hidden="true" />
      <div className="key-access-content">
        <div className="key-access-heading">
          <div className="key-access-mark" aria-hidden="true"><KeyRound size={19} /></div>
          <div>
            <p className="key-access-eyebrow">TOOL ACCESS</p>
            <h3 id="key-access-heading">Generate a key</h3>
            <p className="key-access-subtitle">One-time access for {toolName}</p>
          </div>
          <span className="key-duration"><Clock3 size={14} /> 10 min</span>
        </div>

        {!accessApi.isConfigured ? (
          <div className="key-service-message" role="status">
            <ShieldCheck size={18} />
            <span>The secure key service is not configured yet. Key generation will be available after the backend is deployed.</span>
          </div>
        ) : !ready ? (
          <div className="key-service-message" role="status">Checking your sign-in…</div>
        ) : !generatorToken ? (
          <form className="key-auth-form" onSubmit={connectGenerator}>
            <p className="key-service-message">
              Sign in to AutoDraw, choose <strong>Link website generator</strong>, then enter the short-lived code here. This page does not collect your account password.
            </p>
            <label className="key-field-label" htmlFor="generator-pairing-code">AutoDraw pairing code</label>
            <input
              id="generator-pairing-code"
              className="key-field"
              value={pairingCode}
              onChange={(event) => setPairingCode(event.target.value)}
              autoComplete="one-time-code"
              maxLength={13}
              placeholder="link_XXXXXXXX"
              required
            />
            <Button type="submit" className="key-auth-submit" disabled={busy}>
              {busy ? "Connecting…" : "Connect AutoDraw"}
            </Button>
          </form>
        ) : (
          <div className="key-account-area">
            <div className="key-account-row">
              <p className="key-account-email">Connected to your AutoDraw account</p>
              <Button type="button" variant="ghost" size="sm" onClick={disconnectGenerator} disabled={busy}>
                Disconnect
              </Button>
            </div>
            <div className="key-generate-row">
              <p>Creates a single-use key for {toolName}. Keys expire after 10 minutes; generation is rate-limited.</p>
              <Button
                type="button"
                variant="secondary"
                className="key-generate-button"
                icon={<KeyRound size={16} />}
                onClick={generateKey}
                disabled={busy}
              >
                {busy ? "Working…" : "Generate Key"}
              </Button>
            </div>

            {issuedKey && (
              <div className="key-secret-panel" aria-live="polite">
                <div className="key-secret-topline">
                  <span><ShieldCheck size={15} /> New key · show once</span>
                  <button className="key-copy-button" type="button" onClick={copyIssuedKey} aria-label="Copy generated key">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <code className="key-secret-value">{issuedKey.key}</code>
                <p>Generated {formatDate(issuedKey.createdAt)} · expires in {formatRemaining(issuedKey.expiresAt, clock || issuedKey.createdAt)}</p>
                <p className="key-secret-note">Redeem it in {toolName} before it expires. A successful redemption cannot be repeated.</p>
              </div>
            )}

            <KeyHistory keys={keys} now={clock || issuedKey?.createdAt || 1} busy={busy} onRevoke={revokeKey} />
          </div>
        )}

        {error && <p className="key-feedback key-feedback-error" role="alert">{error}</p>}
        {notice && !error && <p className="key-feedback" role="status">{notice}</p>}
      </div>
    </section>
  );
}

function KeyHistory({
  keys,
  now,
  busy,
  onRevoke,
}: {
  keys: AccessKey[];
  now: number;
  busy: boolean;
  onRevoke: (keyId: string) => void;
}) {
  if (keys.length === 0) {
    return <p className="key-history-empty">No keys generated for this account yet.</p>;
  }

  return (
    <div className="key-history">
      <div className="key-history-heading">
        <h4>Recent keys</h4>
        <span>{keys.length} shown</span>
      </div>
      <ul className="key-history-list">
        {keys.map((key) => {
          const status = key.status === "active" && key.expires_at <= now ? "expired" : key.status;
          return (
            <li key={key.id} className="key-history-item">
              <div className="key-history-main">
                <div className="key-history-title">
                  <code>{key.id}</code>
                  <Badge>{status}</Badge>
                </div>
                <p>Created {formatDate(key.created_at)} · expires {formatDate(key.expires_at)}</p>
                <p>Redeems: {key.uses} · tool checks: {key.tool_requests}{key.used_at ? ` · redeemed ${formatDate(key.used_at)}` : ""}{key.client_version ? ` · client ${key.client_version}` : ""}</p>
              </div>
              {status === "active" && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onRevoke(key.id)} disabled={busy}>
                  Revoke
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

function formatRemaining(expiresAt: number, now: number) {
  const totalSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  if (totalSeconds === 0) return "expired";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}