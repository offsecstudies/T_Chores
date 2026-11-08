import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  Settings,
  History,
  Coins,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Swords,
  Trophy,
  Shield,
  Crown,
  Flag,
  Download,
  Eye,
  Castle,
  BookOpen,
  Star,
} from "lucide-react";
import {
  dateFor,
  days,
  ensureWeek,
  stats,
  updateSettings,
  weekKey,
  pointsInRange,
  rankFor,
  setCompletion,
  type Chore,
  type Milestone,
} from "./model";
import { WorkspaceProvider, useWorkspace } from "./workspace";
import { Treasury, Milestones } from "./treasury";
import { Knight } from "./knight";
import "./style.css";
type InstallPrompt = Event & { prompt(): Promise<void> };
type Tab = "week" | "treasury" | "history" | "settings";
const tabs = [
  { id: "week" as Tab, label: "Quest board", icon: Swords },
  { id: "treasury" as Tab, label: "Treasury", icon: Coins },
  { id: "history" as Tab, label: "Quest journal", icon: BookOpen },
  { id: "settings" as Tab, label: "Parent settings", icon: Settings },
];
function App() {
  const { data, setData, error, status, account, readOnly } = useWorkspace();
  const [now, setNow] = useState(weekKey()),
    [tab, setTab] = useState<Tab>("week"),
    [selected, setSelected] = useState((new Date().getDay() + 6) % 7),
    [viewWeek, setViewWeek] = useState(weekKey()),
    [editing, setEditing] = useState<Chore | null>(null),
    [install, setInstall] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(weekKey()), 30000);
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);
  useEffect(() => {
    if (!readOnly) setData((d) => ensureWeek(d, now));
    setViewWeek(now);
  }, [now, readOnly]);
  const active = tab === "history" ? viewWeek : now;
  // A guest may see a fresh week without creating or changing the owner's document.
  const week = ensureWeek(data, active).weeks[active],
    overall = stats(week),
    daily = stats(week, selected),
    historical = active !== now;
  const allPoints = pointsInRange(data),
    rank = rankFor(allPoints),
    weeklyPoints = pointsInRange(data, active, dayString(dateFor(active, 6)));
  const rewardValue =
      week.reward.mode === "points" ? weeklyPoints : overall.percent,
    rewardPercent = Math.min(
      100,
      Math.round((rewardValue / week.reward.target) * 100),
    );
  const weekLabel = (key: string) =>
    `${dateFor(key).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${dateFor(key, 6).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  const title =
    tab === "week"
      ? "Your next adventure awaits."
      : tab === "treasury"
        ? "Good deeds. Great treasures."
        : tab === "history"
          ? "Every chapter counts."
          : readOnly
            ? "Your guest account"
            : "Behind every great knight.";
  const saveChore = (chore: Chore) => {
    if (readOnly) return;
    setData((d) =>
      updateSettings(
        d,
        now,
        d.chores.some((c) => c.id === chore.id)
          ? d.chores.map((c) => (c.id === chore.id ? chore : c))
          : [...d.chores, chore],
        d.reward,
      ),
    );
    setEditing(null);
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setTab("week");
          }}
        >
          <span className="brand-icon">
            <Shield size={25} />
            <Star size={10} />
          </span>
          <span>
            Teddy Chores<small>THE EVERYDAY QUEST</small>
          </span>
        </a>
        <div className="workspace-label">YOUR ADVENTURE</div>
        <nav>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={19} />
              <span>
                {readOnly && id === "settings" ? "My account" : label}
              </span>
              {tab === id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="crest">
            <Crown size={30} />
          </div>
          <span className="eyebrow">A KNIGHT IN THE MAKING</span>
          <h3>{rank.title}</h3>
          <p>
            Courage in the little things.
            <br />
            Character for the long journey.
          </p>
          <span className="sidebar-gold">
            <Coins size={16} />
            {allPoints.toLocaleString()} lifetime points
          </span>
        </div>
        <div className="profile">
          <span className="avatar">T</span>
          <div>
            <b>Sir Teddy’s realm</b>
            <small>
              {readOnly ? "An honored observer" : "One mission at a time"}
            </small>
          </div>
          <Shield size={16} />
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span className="breadcrumb">
            Teddy’s realm <span>/</span>
            {tabs.find((t) => t.id === tab)?.label}
          </span>
          <span className="local-badge">
            {readOnly ? <Eye size={13} /> : <span />}
            {status}
          </span>
        </header>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        <div className="content">
          <div className="heading">
            <div>
              <div className="eyebrow">
                {tab === "settings"
                  ? "THE ROYAL COUNCIL"
                  : tab === "treasury"
                    ? "FORTUNE FAVORS THE HELPFUL"
                    : "SMALL MISSIONS. A LEGENDARY JOURNEY."}
              </div>
              <h1>{title}</h1>
              <p>
                {tab === "week"
                  ? "A little courage. A little kindness. A new chance to level up."
                  : tab === "treasury"
                    ? "Watch your effort become a story worth telling."
                    : tab === "history"
                      ? "Revisit the missions that made you stronger."
                      : "Shape the missions, celebrate the milestones."}
              </p>
            </div>
            {install && (
              <button
                className="button secondary install"
                onClick={async () => {
                  await install.prompt();
                  setInstall(null);
                }}
              >
                <Download size={17} />
                <span>Install app</span>
              </button>
            )}
          </div>
          {tab === "settings" ? (
            <>
              {account}
              {!readOnly && <ParentSettings now={now} edit={setEditing} />}
            </>
          ) : tab === "treasury" ? (
            <Treasury data={data} />
          ) : (
            <>
              {tab === "week" && (
                <section className="quest-hero">
                  <div className="hero-copy">
                    <span className="hero-label">
                      <Flag size={13} />
                      THE QUEST CONTINUES
                    </span>
                    <h2>
                      Rise and shine,
                      <br />
                      Sir Teddy.
                    </h2>
                    <p>
                      A true knight helps their kingdom.
                      <br />
                      Today, your kingdom starts at home.
                    </p>
                    <div className="hero-badges">
                      <span>
                        <Shield size={14} />
                        {rank.title}
                      </span>
                      <span>
                        <Coins size={14} />
                        {allPoints} lifetime gold
                      </span>
                    </div>
                  </div>
                  <Knight />
                  <span className="hero-corner">
                    EST. ONE GOOD DEED AT A TIME
                  </span>
                </section>
              )}
              <div className="week-toolbar">
                <h2>
                  <CalendarDays size={18} />
                  {historical
                    ? "From the quest journal"
                    : "This week’s campaign"}
                  <span className="week-chip">{weekLabel(active)}</span>
                </h2>
                {tab === "history" ? (
                  <select
                    aria-label="Choose past week"
                    value={viewWeek}
                    onChange={(e) => setViewWeek(e.target.value)}
                  >
                    {[...new Set([now, ...Object.keys(data.weeks)])]
                      .sort()
                      .reverse()
                      .map((key) => (
                        <option key={key} value={key}>
                          {weekLabel(key)}
                          {key === now ? " (current)" : ""}
                        </option>
                      ))}
                  </select>
                ) : (
                  <span className="gentle-note">
                    Make your kingdom proud <Shield size={15} />
                  </span>
                )}
              </div>
              <div className="summary-grid">
                <section className="summary-card progress-card">
                  <div className="summary-top">
                    <span>Campaign progress</span>
                    <span className="soft-icon">
                      <Flag size={19} />
                    </span>
                  </div>
                  <div className="summary-number">
                    {overall.percent}
                    <span>%</span>
                    <small>
                      {overall.done} of {overall.total} missions
                    </small>
                  </div>
                  <div className="progress-track">
                    <div style={{ width: `${overall.percent}%` }} />
                  </div>
                  <p>
                    {overall.percent === 100 && overall.total
                      ? "A campaign worthy of a legend."
                      : "A little more legendary, every day."}
                  </p>
                </section>
                <section className="summary-card points-card">
                  <div className="summary-top">
                    <span>Gold earned this week</span>
                    <span className="soft-icon">
                      <Coins size={20} />
                    </span>
                  </div>
                  <div className="summary-number">
                    {weeklyPoints}
                    <span>points</span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setTab("treasury")}
                  >
                    Open the Treasury <ChevronRight size={14} />
                  </button>
                  <p>Every mission adds to your fortune.</p>
                </section>
                <section className="summary-card reward-card">
                  <div className="summary-top">
                    <span>
                      <Trophy size={17} />
                      This week’s bounty
                    </span>
                    <span className="reward-tag">
                      {rewardPercent >= 100 ? "UNLOCKED" : "ON THE HORIZON"}
                    </span>
                  </div>
                  <h3>{week.reward.title}</h3>
                  <div className="reward-bottom">
                    <div className="reward-track">
                      <div style={{ width: `${rewardPercent}%` }} />
                    </div>
                    <small>
                      {rewardValue}/{week.reward.target}
                      {week.reward.mode === "points" ? " pts" : "%"}
                    </small>
                  </div>
                  <p>
                    {rewardPercent >= 100
                      ? "Treasure earned! Celebrate with your family."
                      : "A reward for a week of noble deeds."}
                  </p>
                </section>
              </div>
              <section className="panel weekly-panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">THE MISSION BOARD</span>
                    <h2>Seven days. Countless chances to shine.</h2>
                    <p>Choose a day. Take on a mission. Make a difference.</p>
                  </div>
                  <Swords className="section-swords" size={25} />
                </div>
                <div
                  className="day-tabs"
                  role="tablist"
                  aria-label="Days of the week"
                >
                  {days.map((day, i) => {
                    const s = stats(week, i),
                      today =
                        dateFor(active, i).toDateString() ===
                        new Date().toDateString();
                    return (
                      <button
                        key={day}
                        role="tab"
                        aria-selected={selected === i}
                        className={`day-tab ${selected === i ? "selected" : ""}`}
                        onClick={() => setSelected(i)}
                      >
                        <span>{day.slice(0, 3)}</span>
                        <b>{dateFor(active, i).getDate()}</b>
                        <span
                          className={`day-dot ${s.percent === 100 && s.total ? "complete" : ""}`}
                        >
                          {s.percent === 100 && s.total ? (
                            <Check size={11} />
                          ) : today ? (
                            <span />
                          ) : null}
                        </span>
                        {today && <small>Today</small>}
                      </button>
                    );
                  })}
                </div>
                <div className="day-heading">
                  <div>
                    <h2>
                      {days[selected]}’s missions<span>{daily.total}</span>
                    </h2>
                    <p>
                      {readOnly
                        ? "An observer’s view of the adventure."
                        : historical
                          ? "A chapter preserved in the royal archives."
                          : daily.percent === 100 && daily.total
                            ? "Missions complete. A noble day’s work!"
                            : "Every great quest begins with showing up."}
                    </p>
                  </div>
                  <div className="day-count">
                    <b>
                      {daily.done}/{daily.total}
                    </b>{" "}
                    complete
                    <div className="mini-track">
                      <div style={{ width: `${daily.percent}%` }} />
                    </div>
                  </div>
                </div>
                <div className="chore-list">
                  {week.chores
                    .filter((c) => c.days.includes(selected))
                    .map((c, i) => {
                      const checked = !!week.completed[`${c.id}:${selected}`],
                        Icon = [Shield, Swords, Castle, Flag][i % 4];
                      return (
                        <label
                          key={c.id}
                          className={`chore-row ${checked ? "done" : ""}`}
                        >
                          <input
                            type="checkbox"
                            aria-label={c.title}
                            checked={checked}
                            disabled={historical || readOnly}
                            onChange={() => {
                              if (!historical && !readOnly)
                                setData((d) =>
                                  setCompletion(d, now, c.id, selected),
                                );
                            }}
                          />
                          <span className={`chore-icon color-${i % 4}`}>
                            <Icon size={22} />
                          </span>
                          <span className="chore-text">
                            <b>{c.title}</b>
                            <small>{c.category}</small>
                          </span>
                          <span className="chore-points">
                            <Coins size={14} />
                            {checked
                              ? (week.earned?.[`${c.id}:${selected}`] ??
                                c.points)
                              : c.points}
                            <span>pts</span>
                          </span>
                        </label>
                      );
                    })}
                  {!daily.total && (
                    <div className="empty">
                      <Castle size={30} />
                      <h3>The kingdom is at peace.</h3>
                      <p>
                        No missions scheduled for {days[selected]}. Rest well,
                        brave knight.
                      </p>
                    </div>
                  )}
                </div>
                <div className="panel-footer">
                  <Shield size={15} />
                  {readOnly
                    ? "Guest mode · only the parent can make changes"
                    : "Bravery is trying. Honor is following through."}
                </div>
              </section>
              {tab === "week" && (
                <>
                  <div className="encouragement">
                    <span className="encourage-star">
                      <Swords size={28} />
                    </span>
                    <div>
                      <b>A noble heart is the greatest treasure.</b>
                      <p>
                        Helping at home builds more than habits. It builds
                        character.
                      </p>
                    </div>
                    <span className="high-five">
                      Onward, adventurer <ChevronRight size={16} />
                    </span>
                  </div>
                  <Milestones data={data} compact />
                  <button
                    className="history-link"
                    onClick={() => setTab("history")}
                  >
                    Explore the quest journal <ChevronRight size={16} />
                  </button>
                </>
              )}
            </>
          )}
          <footer>
            <Shield size={11} /> Teddy Chores <span>✦</span> Great knights begin
            with little deeds.
          </footer>
        </div>
      </main>
      {editing && !readOnly && (
        <ChoreEditor
          chore={editing}
          existing={data.chores.some((c) => c.id === editing.id)}
          onSave={saveChore}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
function dayString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function ParentSettings({
  now,
  edit,
}: {
  now: string;
  edit: (chore: Chore) => void;
}) {
  const { data, setData } = useWorkspace();
  const [notice, setNotice] = useState(""),
    [milestone, setMilestone] = useState<Milestone | null>(null);
  const saveMilestone = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      title = String(f.get("title")).trim(),
      target = Number(f.get("target"));
    if (!title || !Number.isSafeInteger(target) || target < 1) return;
    const item = { id: milestone?.id || crypto.randomUUID(), title, target };
    setData((d) => ({
      ...d,
      milestones: milestone
        ? (d.milestones || []).map((m) => (m.id === item.id ? item : m))
        : [...(d.milestones || []), item],
    }));
    setMilestone(null);
    form.reset();
    setNotice("Treasure milestone saved.");
  };
  return (
    <>
      <section className="panel settings-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A ROUTINE FIT FOR A KNIGHT</span>
            <h2>Mission roster</h2>
            <p>Changes apply to this week and future campaigns.</p>
          </div>
          <button
            className="button"
            onClick={() =>
              edit({
                id: crypto.randomUUID(),
                title: "",
                category: "My space",
                points: 5,
                days: [0, 1, 2, 3, 4, 5, 6],
              })
            }
          >
            <Plus size={18} />
            Add mission
          </button>
        </div>
        {data.chores.map((c) => (
          <div className="setting-row" key={c.id}>
            <div>
              <b>{c.title}</b>
              <small>
                {c.days.length === 7
                  ? "Every day"
                  : c.days.map((d) => days[d].slice(0, 3)).join(", ")}{" "}
                · {c.points} points
              </small>
            </div>
            <button
              className="icon-button"
              aria-label={`Edit ${c.title}`}
              onClick={() => edit({ ...c, days: [...c.days] })}
            >
              <Pencil size={17} />
            </button>
            <button
              className="icon-button delete"
              aria-label={`Delete ${c.title}`}
              onClick={() => {
                if (
                  confirm(
                    `Remove “${c.title}” from this week and future campaigns? Earned points and past weeks will be kept.`,
                  )
                )
                  setData((d) =>
                    updateSettings(
                      d,
                      now,
                      d.chores.filter((x) => x.id !== c.id),
                      d.reward,
                    ),
                  );
              }}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        {!data.chores.length && (
          <p>Add your first mission to begin the adventure.</p>
        )}
      </section>
      <section className="panel settings-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BUILD THE TREASURE MAP</span>
            <h2>Reward milestones</h2>
            <p>
              Set multiple rewards at different lifetime point levels. Reaching
              a goal doesn’t spend points.
            </p>
          </div>
          <Crown size={26} />
        </div>
        {[...(data.milestones || [])]
          .sort((a, b) => a.target - b.target)
          .map((m) => (
            <div className="setting-row" key={m.id}>
              <div>
                <b>{m.title}</b>
                <small>{m.target} lifetime points</small>
              </div>
              <button
                className="icon-button"
                aria-label={`Edit reward ${m.title}`}
                onClick={() => setMilestone(m)}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-button delete"
                aria-label={`Delete reward ${m.title}`}
                onClick={() => {
                  if (confirm(`Delete reward “${m.title}”?`))
                    setData((d) => ({
                      ...d,
                      milestones: (d.milestones || []).filter(
                        (x) => x.id !== m.id,
                      ),
                    }));
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        <form
          key={milestone?.id || "new"}
          className="reward-form"
          onSubmit={saveMilestone}
        >
          <h3>{milestone ? "Edit treasure" : "Add a treasure"}</h3>
          <div className="form-grid">
            <label>
              Reward name
              <input
                name="title"
                required
                maxLength={100}
                defaultValue={milestone?.title || ""}
                placeholder="An extra bedtime story"
              />
            </label>
            <label>
              Lifetime points required
              <input
                name="target"
                type="number"
                min="1"
                max="1000000"
                step="1"
                required
                defaultValue={milestone?.target || 100}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button">
              <Plus size={17} />
              {milestone ? "Save milestone" : "Add milestone"}
            </button>
            {milestone && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setMilestone(null)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="panel settings-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A LITTLE EXTRA MOTIVATION</span>
            <h2>Weekly bounty</h2>
            <p>A separate goal that starts fresh each week.</p>
          </div>
          <Trophy size={24} />
        </div>
        <form
          key={now}
          className="reward-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              title = String(f.get("title")).trim(),
              target = Number(f.get("target")),
              mode = f.get("mode") as "points" | "completion";
            if (!title) return;
            if (mode === "completion" && target > 100) {
              setNotice("Completion goals must be between 1 and 100%.");
              return;
            }
            setData((d) =>
              updateSettings(d, now, d.chores, { title, mode, target }),
            );
            setNotice("Weekly bounty saved.");
          }}
        >
          <label>
            Weekly reward name
            <input
              name="title"
              required
              maxLength={100}
              defaultValue={data.reward.title}
            />
          </label>
          <div className="form-grid">
            <label>
              Goal type
              <select name="mode" defaultValue={data.reward.mode}>
                <option value="points">Points earned</option>
                <option value="completion">Completion percentage</option>
              </select>
            </label>
            <label>
              Target
              <input
                name="target"
                type="number"
                min="1"
                max="100000"
                required
                defaultValue={data.reward.target}
              />
            </label>
          </div>
          <button className="button">Save weekly bounty</button>
        </form>
      </section>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <p className="storage-note">
        Guest permissions are enforced in the database. Keep your parent
        password private.
      </p>
    </>
  );
}
function ChoreEditor({
  chore,
  existing,
  onSave,
  onClose,
}: {
  chore: Chore;
  existing: boolean;
  onSave: (chore: Chore) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(chore),
    ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector("input")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key !== "Tab") return;
          const items = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input,select",
            ),
          );
          const first = items[0],
            last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="section-heading">
          <h2 id="editor-title">
            {existing ? "Edit mission" : "A new noble mission"}
          </h2>
          <button
            className="icon-button"
            aria-label="Close editor"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.days.length && draft.title.trim())
              onSave({ ...draft, title: draft.title.trim() });
          }}
        >
          <label>
            Mission name
            <input
              required
              maxLength={80}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {[
                "My space",
                "Self care",
                "Helping out",
                "Learning",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Points (0 for an unscored mission)
            <input
              type="number"
              min="0"
              max="1000"
              required
              value={draft.points}
              onChange={(e) =>
                setDraft({ ...draft, points: Number(e.target.value) })
              }
            />
          </label>
          <div className="schedule-label">
            Repeat on
            <button
              type="button"
              onClick={() =>
                setDraft({ ...draft, days: [0, 1, 2, 3, 4, 5, 6] })
              }
            >
              Every day
            </button>
          </div>
          <div className="schedule-days">
            {days.map((day, i) => (
              <button
                type="button"
                aria-label={day}
                aria-pressed={draft.days.includes(i)}
                key={day}
                className={draft.days.includes(i) ? "picked" : ""}
                onClick={() =>
                  setDraft({
                    ...draft,
                    days: draft.days.includes(i)
                      ? draft.days.filter((d) => d !== i)
                      : [...draft.days, i].sort(),
                  })
                }
              >
                {day.slice(0, 2)}
              </button>
            ))}
          </div>
          {!draft.days.length && (
            <p className="validation">Choose at least one day.</p>
          )}
          <button
            className="button full"
            disabled={!draft.days.length || !draft.title.trim()}
          >
            Save mission
          </button>
        </form>
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <WorkspaceProvider>
    <App />
  </WorkspaceProvider>,
);
