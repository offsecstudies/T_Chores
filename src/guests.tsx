import { useEffect, useState } from "react";
import { cloud } from "./workspace";
import { connectionError } from "./errors";
import { familyGuestEmail, loginEmail } from "./auth";
import { Eye, UserPlus, Trash2 } from "lucide-react";
type Guest = { guest_id: string; guest_email: string };
export function GuestSettings({ ownerId }: { ownerId: string }) {
  const [guests, setGuests] = useState<Guest[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const { data, error } = await cloud!
      .from("chore_guests")
      .select("guest_id,guest_email")
      .eq("owner_id", ownerId);
    if (error) {
      setMessage(connectionError(error));
      return;
    }
    setGuests(data || []);
  }
  useEffect(() => {
    void refresh();
  }, [ownerId]);
  return (
    <section className="panel settings-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">INVITE AN OBSERVER</span>
          <h2>
            <Eye size={20} />
            Guest access
          </h2>
        </div>
        <UserPlus size={24} />
      </div>
      <p>
        Guests can follow the quest, view history and explore the Treasury. They
        cannot change missions, progress, rewards or settings.
      </p>
      <p className="fine-print">
        For the shared Family login, first create a confirmed Supabase Auth user
        with email <code>{familyGuestEmail}</code> and your chosen password.
        Then grant access to “Family” below. The password is never stored in app
        code.
      </p>
      <ol className="guest-steps">
        <li>
          Ask your guest to choose “Create guest account” on the sign-in page
          and confirm their email.
        </li>
        <li>Enter their email below to grant access to this family.</li>
      </ol>
      <form
        className="guest-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const email = loginEmail(
            String(new FormData(form).get("guestEmail")),
          );
          setBusy(true);
          const { error } = await cloud!.rpc("grant_chore_guest", { email });
          setBusy(false);
          if (error) setMessage(connectionError(error));
          else {
            setMessage("Guest access granted. They can sign in or tap Retry.");
            form.reset();
            await refresh();
          }
        }}
      >
        <label>
          Guest email or Family username
          <input
            name="guestEmail"
            type="text"
            required
            autoComplete="off"
            placeholder="Family or guest@example.com"
          />
        </label>
        <button className="button" disabled={busy}>
          <UserPlus size={17} />
          {busy ? "Granting…" : "Grant access"}
        </button>
      </form>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="guest-list">
        {guests.map((g) => (
          <div className="setting-row" key={g.guest_id}>
            <div>
              <b>{g.guest_email}</b>
              <small>Read-only observer</small>
            </div>
            <button
              className="icon-button delete"
              aria-label={`Revoke access for ${g.guest_email}`}
              disabled={busy}
              onClick={async () => {
                if (!confirm(`Revoke guest access for ${g.guest_email}?`))
                  return;
                setBusy(true);
                const { error } = await cloud!.rpc("revoke_chore_guest", {
                  guest: g.guest_id,
                });
                setBusy(false);
                if (error) setMessage(connectionError(error));
                else {
                  setMessage("Guest access revoked.");
                  await refresh();
                }
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
