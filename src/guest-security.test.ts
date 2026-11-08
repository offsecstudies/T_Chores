import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const owner = "00000000-0000-0000-0000-000000000001",
  guest = "00000000-0000-0000-0000-000000000002",
  other = "00000000-0000-0000-0000-000000000003";
let db: PGlite;
async function asUser(id: string) {
  await db.exec(
    `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
describe("guest database permissions (PostgreSQL)", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'::jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated;`,
    );
    await db.exec(readFileSync("supabase/schema.sql", "utf8"));
    await db.exec(readFileSync("supabase/guest-access.sql", "utf8"));
    await db.exec(readFileSync("supabase/guest-access.sql", "utf8"));
    await db.exec(
      `insert into auth.users(id,email,email_confirmed_at) values('${owner}','parent@example.com',now()),('${guest}','family@teddy-chores.example',now()),('${other}','other@example.com',now());insert into public.chore_accounts(user_id,data) values('${owner}','{"version":1}'),('${other}','{"version":1}');`,
    );
  }, 30000);
  afterAll(async () => {
    await db.close();
  });
  it("lets a parent grant access to a confirmed guest", async () => {
    await asUser(owner);
    await db.query(
      "select public.grant_chore_guest('family@teddy-chores.example')",
    );
    const result = await db.query("select guest_id from public.chore_guests");
    expect(result.rows).toEqual([{ guest_id: guest }]);
  });
  it("lets a guest read only the linked family", async () => {
    await asUser(guest);
    const result = await db.query("select user_id from public.chore_accounts");
    expect(result.rows).toEqual([{ user_id: owner }]);
  });
  it("blocks changes to the owner document, even with a direct API equivalent", async () => {
    await asUser(guest);
    const result = await db.query(
      `update public.chore_accounts set revision=123 where user_id='${owner}' returning user_id`,
    );
    expect(result.rows).toHaveLength(0);
  });
  it("blocks guests from inserting documents or altering membership", async () => {
    await asUser(guest);
    await expect(
      db.query(
        `insert into public.chore_accounts(user_id,data) values('${guest}','{"version":1}')`,
      ),
    ).rejects.toThrow(/row-level security/i);
    await expect(
      db.query(
        `insert into public.chore_guests(guest_id,owner_id,guest_email) values('${other}','${owner}','other@example.com')`,
      ),
    ).rejects.toThrow(/permission denied/i);
  });
  it("blocks guests from granting access to someone else", async () => {
    await asUser(guest);
    await expect(
      db.query("select public.grant_chore_guest('other@example.com')"),
    ).rejects.toThrow(/Only a parent/i);
  });
  it("does not expose the family to an unrelated account", async () => {
    await asUser(other);
    const result = await db.query("select user_id from public.chore_accounts");
    expect(result.rows).toEqual([{ user_id: other }]);
  });
  it("keeps parent writes working", async () => {
    await asUser(owner);
    const result = await db.query(
      `update public.chore_accounts set revision=1 where user_id='${owner}' returning revision`,
    );
    expect(result.rows).toEqual([{ revision: 1 }]);
  });
  it("does not allow a parent account to be forcibly enrolled as a guest", async () => {
    await asUser(owner);
    await expect(
      db.query("select public.grant_chore_guest('other@example.com')"),
    ).rejects.toThrow(/Create guest account/i);
  });
  it("blocks anonymous reads", async () => {
    await db.exec("reset role;set role anon;");
    await expect(
      db.query("select * from public.chore_accounts"),
    ).rejects.toThrow(/permission denied/i);
  });
  it("revokes guest reads without deleting progress", async () => {
    await asUser(owner);
    await db.query(`select public.revoke_chore_guest('${guest}')`);
    await asUser(guest);
    expect(
      (await db.query("select user_id from public.chore_accounts")).rows,
    ).toHaveLength(0);
    await asUser(owner);
    expect(
      (await db.query("select revision from public.chore_accounts")).rows,
    ).toEqual([{ revision: 1 }]);
  });
});
