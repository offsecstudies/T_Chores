import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import { ensureWeek, seed, weekKey, type Data } from "./model";
import { localRepository, valid } from "./storage";
import { apply, backend, diff, flush, type Change } from "./sync";
import { connectionError } from "./errors";
import { GuestSettings } from "./guests";
import { loginEmail, familyGuestEmail } from "./auth";
const env = import.meta.env;
export const cloud =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : null;
type Workspace = {
  readOnly: boolean;
  data: Data;
  setData: Dispatch<SetStateAction<Data>>;
  error: string;
  status: string;
  account: ReactNode;
};
const Context = createContext<Workspace | null>(null);
export function useWorkspace() {
  return useContext(Context)!;
}
function Local({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return { data: ensureWeek(localRepository.load(), weekKey()), error: "" };
    } catch {
      return {
        data: ensureWeek(seed(), weekKey()),
        error:
          "Saved progress could not be read. Writes are disabled to protect it.",
      };
    }
  });
  const [data, setData] = useState(initial.data),
    [error, setError] = useState(initial.error);
  useEffect(() => {
    if (initial.error) return;
    try {
      localRepository.save(data);
      setError("");
    } catch {
      setError("Storage is unavailable. Changes are only in memory.");
    }
  }, [data, initial.error]);
  return (
    <Context.Provider
      value={{
        readOnly: false,
        data,
        setData,
        error,
        status: "Stored on this device",
        account: (
          <p className="storage-note">
            Sync isn’t connected yet. This device’s progress stays local. Follow
            the Supabase setup guide in the README to enable accounts.
          </p>
        ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
function Auth() {
  const [guestSignup, setGuestSignup] = useState(false);
  const [signup, setSignup] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="auth-shell">
      <section className="panel settings-panel">
        <div className="eyebrow">TEDDY CHORES</div>
        <h1>
          {signup
            ? guestSignup
              ? "Create guest account"
              : "Create your family account"
            : "Welcome back, adventurer"}
        </h1>
        <p>Parents and invited guests: sign in to follow Teddy’s quest.</p>
        <form
          className="reward-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const f = new FormData(e.currentTarget);
            try {
              const credentials = {
                email: signup
                  ? String(f.get("email")).trim()
                  : loginEmail(String(f.get("email"))),
                password: String(f.get("password")),
              };
              const { error } = signup
                ? await cloud!.auth.signUp({
                    ...credentials,
                    options: {
                      data: { account_type: guestSignup ? "guest" : "parent" },
                    },
                  })
                : await cloud!.auth.signInWithPassword(credentials);
              if (error) throw error;
              if (signup)
                setMessage(
                  "Check your email to confirm your account, then sign in.",
                );
            } catch (e) {
              setMessage(connectionError(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {signup ? "Email" : "Email or username"}
            <input
              name="email"
              type={signup ? "email" : "text"}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete={signup ? "new-password" : "current-password"}
              required
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
          </button>
          {message && <p role="status">{message}</p>}
        </form>
        <button
          className="history-link"
          onClick={() => {
            setSignup(!signup);
            setGuestSignup(false);
            setMessage("");
          }}
        >
          {signup
            ? "Already have an account? Sign in"
            : "New here? Create a parent account"}
        </button>
        {!signup && (
          <button
            className="history-link"
            onClick={() => {
              setSignup(true);
              setGuestSignup(true);
              setMessage("");
            }}
          >
            Create guest account
          </button>
        )}
      </section>
    </div>
  );
}
function Online({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  const [data, render] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Connecting…"),
    [choice, setChoice] = useState(false);
  const current = useRef<Data | null>(null),
    pending = useRef<Change[]>([]),
    busy = useRef(false),
    ready = useRef(false),
    alive = useRef(true);
  const remote = useRef(backend(cloud!, session.user.id)).current;
  const cacheKey = `teddy-cloud:v1:${session.user.id}`;
  const persist = () => {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: current.current, pending: pending.current }),
      );
    } catch {
      setError(
        "Device backup unavailable. Keep this page open until changes finish syncing.",
      );
    }
  };
  const publish = (next: Data) => {
    current.current = next;
    render(next);
    persist();
  };
  async function sync() {
    if (busy.current || !ready.current) return;
    if (!navigator.onLine) {
      setStatus("Waiting to sync");
      return;
    }
    busy.current = true;
    const batch = [...pending.current];
    try {
      const next = batch.length
        ? await flush(remote, batch)
        : (await remote.read())?.data;
      if (!alive.current) return;
      if (!next) throw Error("Account data is missing");
      pending.current.splice(0, batch.length);
      publish(apply(next, pending.current));
      setError("");
      setStatus(pending.current.length ? "Syncing…" : "Synced across devices");
    } catch (e) {
      if (alive.current) {
        setError(
          `Sync paused: ${connectionError(e)} Changes will retry automatically.`,
        );
        setStatus("Waiting to sync");
      }
    } finally {
      busy.current = false;
    }
  }
  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setInterval>;
    async function load() {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!valid(parsed.data) || !Array.isArray(parsed.pending))
            throw Error("Device backup could not be read");
          pending.current = parsed.pending;
          current.current = parsed.data;
          if (!navigator.onLine) {
            render(parsed.data);
            ready.current = true;
            setStatus("Waiting to sync");
            return;
          }
        }
        const row = await remote.read();
        if (!alive.current) return;
        if (!row) {
          setChoice(true);
          return;
        }
        publish(apply(row.data, pending.current));
        ready.current = true;
        void sync();
      } catch (e) {
        if (!alive.current) return;
        if (current.current) {
          render(current.current);
          ready.current = true;
        }
        setError(`Unable to connect: ${connectionError(e)}`);
      }
    }
    void load();
    timer = setInterval(() => void sync(), 4000);
    const wake = () => void sync();
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);
    return () => {
      alive.current = false;
      clearInterval(timer);
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
    };
  }, []);
  async function initialize(importLocal: boolean) {
    try {
      let initial = importLocal ? localRepository.load() : seed();
      initial = ensureWeek(initial, weekKey());
      await remote.create(initial);
      const row = await remote.read();
      if (!row) throw Error("Could not create account data");
      pending.current = [];
      publish(row.data);
      ready.current = true;
      setChoice(false);
      setError("");
      setStatus("Synced across devices");
    } catch (e) {
      setError(connectionError(e));
    }
  }
  const logout = async () => {
    if (pending.current.length) {
      setError("Wait for your pending changes to sync before signing out.");
      return;
    }
    const { error } = await cloud!.auth.signOut();
    if (error) setError(error.message);
  };
  if (choice)
    return (
      <div className="auth-shell">
        <section className="panel settings-panel">
          <h1>Your first synced device</h1>
          <p>
            This account has no progress yet. Bring this browser’s existing
            chores and history with you, or start with the default routine.
            Existing local data is kept.
          </p>
          <div className="auth-actions">
            <button className="button" onClick={() => void initialize(true)}>
              Import this device’s progress
            </button>
            <button
              className="button secondary"
              onClick={() => void initialize(false)}
            >
              Start fresh
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          <button className="history-link" onClick={() => void logout()}>
            Sign out
          </button>
        </section>
      </div>
    );
  if (!data)
    return (
      <div className="auth-shell">
        <section className="panel settings-panel">
          <h2>
            {error
              ? "Couldn’t load your family’s progress"
              : "Loading your family’s progress…"}
          </h2>
          {error && <p role="alert">{error}</p>}
          <button className="button" onClick={() => location.reload()}>
            Retry
          </button>
          <button className="history-link" onClick={() => void logout()}>
            Sign out
          </button>
        </section>
      </div>
    );
  const setData: Dispatch<SetStateAction<Data>> = (action) => {
    const prev = current.current!;
    const next = typeof action === "function" ? action(prev) : action;
    pending.current.push(...diff(prev, next));
    publish(next);
    setStatus("Syncing…");
    void sync();
  };
  return (
    <Context.Provider
      value={{
        readOnly: false,
        data,
        setData,
        error,
        status,
        account: (
          <>
            <GuestSettings ownerId={session.user.id} />
            <section className="panel settings-panel">
              <h2>Family account</h2>
              <p>{session.user.email}</p>
              <p role="status">
                {status}. Use this same parent account on your other devices.
                Guests use separate accounts with read-only access.
              </p>
              <button
                className="button secondary"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </section>
          </>
        ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
function GuestWorkspace({
  session,
  ownerId,
  children,
}: {
  session: Session;
  ownerId: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true,
      busy = false;
    const remote = backend(cloud!, ownerId);
    async function refresh() {
      if (busy) return;
      busy = true;
      try {
        const row = await remote.read();
        if (!alive) return;
        if (!row) {
          setData(null);
          setError(
            "Guest access is no longer available. Ask the parent to grant access again.",
          );
        } else {
          setData(row.data);
          setError("");
        }
      } catch (e) {
        if (alive) {
          setData(null);
          setError(connectionError(e));
        }
      } finally {
        busy = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [ownerId]);
  if (!data)
    return (
      <div className="auth-shell">
        <section className="panel settings-panel">
          <h2>Guest access</h2>
          <p role="status">{error || "Opening the quest log…"}</p>
          <button className="button" onClick={() => location.reload()}>
            Retry
          </button>
          <button
            className="history-link"
            onClick={() => void cloud!.auth.signOut()}
          >
            Sign out
          </button>
        </section>
      </div>
    );
  return (
    <Context.Provider
      value={{
        data,
        setData: () => {},
        readOnly: true,
        error: "",
        status: "Guest · view only",
        account: (
          <section className="panel settings-panel">
            <h2>Guest account</h2>
            <p>{session.user.email}</p>
            <p>
              You can view this quest, its history and rewards. Only the parent
              can make changes.
            </p>
            <button
              className="button secondary"
              onClick={() => void cloud!.auth.signOut()}
            >
              Sign out
            </button>
          </section>
        ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
function AccountWorkspace({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  const [access, setAccess] = useState<{
      ownerId: string;
      guest: boolean;
    } | null>(null),
    [error, setError] = useState(""),
    [waiting, setWaiting] = useState(false);
  useEffect(() => {
    let active = true;
    const roleKey = `teddy-owner:v1:${session.user.id}`;
    // Only previously verified owners can reopen their own cached data offline.
    // Guest documents are never saved to local storage; live RLS still controls all requests.
    function offlineOwner() {
      try {
        return !navigator.onLine && localStorage.getItem(roleKey) === "owner";
      } catch {
        return false;
      }
    }
    if (!navigator.onLine) {
      if (offlineOwner()) setAccess({ ownerId: session.user.id, guest: false });
      else setError("Connect to the internet to verify account access.");
      return () => {
        active = false;
      };
    }
    Promise.resolve(
      cloud!
        .from("chore_guests")
        .select("owner_id")
        .eq("guest_id", session.user.id)
        .maybeSingle(),
    )
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          if (offlineOwner())
            setAccess({ ownerId: session.user.id, guest: false });
          else setError(connectionError(error));
          return;
        }
        if (data) {
          try {
            localStorage.removeItem(roleKey);
          } catch {
            /* optional cache */
          }
          setAccess({ ownerId: data.owner_id, guest: true });
        } else if (
          session.user.user_metadata.account_type === "guest" ||
          session.user.email?.toLowerCase() === familyGuestEmail
        ) {
          try {
            localStorage.removeItem(roleKey);
          } catch {
            /* optional cache */
          }
          setWaiting(true);
        } else {
          try {
            localStorage.setItem(roleKey, "owner");
          } catch {
            /* optional cache */
          }
          setAccess({ ownerId: session.user.id, guest: false });
        }
      })
      .catch((e) => {
        if (active) {
          if (offlineOwner())
            setAccess({ ownerId: session.user.id, guest: false });
          else setError(connectionError(e));
        }
      });
    return () => {
      active = false;
    };
  }, [session.user.id]);
  if (!access)
    return (
      <div className="auth-shell">
        <section className="panel settings-panel">
          <h2>
            {waiting
              ? "Awaiting a royal invitation"
              : error
                ? "Account setup needed"
                : "Opening the quest log…"}
          </h2>
          <p role="status">
            {waiting
              ? "Ask the parent to grant guest access to " +
                session.user.email +
                " in Parent settings."
              : error}
          </p>
          <button className="button" onClick={() => location.reload()}>
            Retry
          </button>
          <button
            className="history-link"
            onClick={() => void cloud!.auth.signOut()}
          >
            Sign out
          </button>
        </section>
      </div>
    );
  return access.guest ? (
    <GuestWorkspace session={session} ownerId={access.ownerId}>
      {children}
    </GuestWorkspace>
  ) : (
    <Online session={session}>{children}</Online>
  );
}
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined),
    [error, setError] = useState("");
  useEffect(() => {
    if (!cloud) return;
    let active = true;
    cloud.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          if (error) setError(error.message);
          setSession(data.session);
        }
      })
      .catch(() => {
        if (active) setError("Could not load sign-in. Reload to retry.");
      });
    const { data } = cloud.auth.onAuthStateChange((_event, s) => {
      if (active) setSession(s);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  if (!cloud) return <Local>{children}</Local>;
  if (error)
    return (
      <div className="error" role="alert">
        {error}
      </div>
    );
  if (session === undefined)
    return <div className="auth-shell">Checking sign-in…</div>;
  if (!session) return <Auth />;
  return (
    <AccountWorkspace key={session.user.id} session={session}>
      {children}
    </AccountWorkspace>
  );
}
