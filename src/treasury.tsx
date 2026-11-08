import { useState } from "react";
import { Coins, Crown, LockKeyhole, Check, ScrollText } from "lucide-react";
import {
  dayKey,
  dateFor,
  earningEntries,
  pointsInRange,
  rankFor,
  ranks,
  weekKey,
  type Data,
} from "./model";
export function Treasury({ data }: { data: Data }) {
  const [period, setPeriod] = useState("all"),
    [from, setFrom] = useState(dayKey(dateFor(weekKey()))),
    [to, setTo] = useState(dayKey(new Date()));
  const start =
      period === "week" ? weekKey() : period === "custom" ? from : undefined,
    end =
      period === "week"
        ? dayKey(dateFor(weekKey(), 6))
        : period === "custom"
          ? to
          : undefined;
  const invalid = period === "custom" && (!from || !to || from > to),
    total = pointsInRange(data),
    points = invalid ? 0 : pointsInRange(data, start, end);
  const rank = rankFor(total),
    next = ranks.find((r) => r.points > total);
  const entries = Object.entries(data.weeks)
    .flatMap(([key, week]) => earningEntries(key, week))
    .filter((e) => (!start || e.date >= start) && (!end || e.date <= end))
    .sort((a, b) => b.date.localeCompare(a.date));
  const grouped = entries.reduce<Record<string, number>>(
    (out, e) => ({ ...out, [e.date]: (out[e.date] || 0) + e.points }),
    {},
  );
  return (
    <>
      <section className="treasury-banner">
        <div className="treasure-seal">
          <Coins size={42} />
        </div>
        <div>
          <span className="eyebrow">THE ROYAL TREASURY</span>
          <h2>Every good deed has its gold.</h2>
          <p>Your missions build a fortune of effort, courage and kindness.</p>
        </div>
        <div className="lifetime">
          <b>{total.toLocaleString()}</b>
          <span>all-time points</span>
        </div>
      </section>
      <section className="panel treasury-panel">
        <div className="section-heading">
          <div>
            <h2>
              <Coins size={20} /> Points earned
            </h2>
            <p>
              Explore your gold across the whole adventure, or choose a chapter.
            </p>
          </div>
          <select
            aria-label="Points period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="custom">Custom dates</option>
          </select>
        </div>
        {period === "custom" && (
          <div className="date-range">
            <label>
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <span>to</span>
            <label>
              Through
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
        )}
        {invalid ? (
          <p role="alert" className="notice">
            Choose a start date on or before the end date.
          </p>
        ) : (
          <div className="treasury-total">
            <Coins size={30} />
            <b>{points.toLocaleString()}</b>
            <span>points earned</span>
          </div>
        )}
        <p className="fine-print">
          Totals use the mission’s scheduled date, including both selected
          dates. Unchecking a mission removes its points. Gold is a point total,
          not money.
        </p>
        <div className="earnings-list">
          <h3>
            <ScrollText size={17} />
            The ledger
          </h3>
          {!invalid &&
            Object.entries(grouped).map(([date, value]) => (
              <div className="ledger-row" key={date}>
                <span>
                  {new Date(date + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <b>
                  +{value} <Coins size={14} />
                </b>
              </div>
            ))}
          {!invalid && !entries.length && (
            <div className="empty">
              No points earned in this chapter yet. Your next mission awaits.
            </div>
          )}
        </div>
      </section>
      <section className="rank-panel panel">
        <div className="rank-emblem">
          <Crown size={31} />
        </div>
        <div>
          <span className="eyebrow">CHARACTER GROWS WITH EVERY MISSION</span>
          <h2>{rank.title}</h2>
          <p>
            {next
              ? `${Math.max(0, next.points - total)} more points to become a ${next.title.toLowerCase()}.`
              : "A champion of courage, kindness and follow-through."}
          </p>
        </div>
        <span className="rank-label">{total} XP</span>
      </section>
      <Milestones data={data} />
    </>
  );
}
export function Milestones({
  data,
  compact = false,
}: {
  data: Data;
  compact?: boolean;
}) {
  const total = pointsInRange(data),
    items = [...(data.milestones || [])].sort((a, b) => a.target - b.target);
  return (
    <section className={`panel milestones-panel ${compact ? "compact" : ""}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">TREASURES WORTH THE JOURNEY</span>
          <h2>
            <Crown size={20} />
            Reward milestones
          </h2>
          <p>Unlocked by lifetime points. No gold is spent.</p>
        </div>
        <span className="pill">
          {items.filter((m) => total >= m.target).length}/{items.length}{" "}
          unlocked
        </span>
      </div>
      {items.length ? (
        <div className="milestone-grid">
          {items.map((m, i) => {
            const unlocked = total >= m.target;
            return (
              <article
                className={`milestone ${unlocked ? "unlocked" : ""}`}
                key={m.id}
              >
                <div className="milestone-top">
                  <span className="milestone-symbol">
                    {unlocked ? <Crown size={23} /> : <LockKeyhole size={21} />}
                  </span>
                  <span className="milestone-level">
                    TREASURE {String(i + 1).padStart(2, "0")}
                  </span>
                  {unlocked && <Check size={17} />}
                </div>
                <h3>{m.title}</h3>
                <b className="gold-number">
                  <Coins size={15} />
                  {m.target.toLocaleString()} points
                </b>
                <div className="progress-track">
                  <div
                    style={{
                      width: `${Math.min(100, (total / m.target) * 100)}%`,
                    }}
                  />
                </div>
                <small>
                  {unlocked
                    ? "Unlocked · celebrate with your family"
                    : `${m.target - total} points to unlock`}
                </small>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          Your treasure map is waiting. A parent can add reward milestones in
          settings.
        </div>
      )}
    </section>
  );
}
