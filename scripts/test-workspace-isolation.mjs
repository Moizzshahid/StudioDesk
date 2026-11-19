import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TEST_USER_A_EMAIL",
  "TEST_USER_A_PASSWORD",
  "TEST_USER_B_EMAIL",
  "TEST_USER_B_PASSWORD",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const makeClient = () =>
  createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const accountA = makeClient();
const accountB = makeClient();
const suffix = `rls-check-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdByA = [];
const createdByB = [];

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${label} sign-in failed: ${error.message}`);
  return data.user;
}

async function getWorkspaceId(client, userId, label) {
  const { data, error } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .single();
  if (error || !data?.workspace_id) {
    throw new Error(`${label} could not resolve its workspace membership: ${error?.message ?? "no membership"}`);
  }
  return data.workspace_id;
}

async function createProject(client, workspaceId, name, bucket) {
  const { data, error } = await client
    .from("projects")
    .insert({ workspace_id: workspaceId, name, status: "planning" })
    .select("id,name,workspace_id")
    .single();
  if (error) throw new Error(`Could not create ${name}: ${error.message}`);
  bucket.push(data.id);
  return data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS  ${message}`);
}

try {
  const [userA, userB] = await Promise.all([
    signIn(accountA, process.env.TEST_USER_A_EMAIL, process.env.TEST_USER_A_PASSWORD, "Account A"),
    signIn(accountB, process.env.TEST_USER_B_EMAIL, process.env.TEST_USER_B_PASSWORD, "Account B"),
  ]);
  assert(userA.id !== userB.id, "the two test accounts are distinct");

  const [workspaceA, workspaceB] = await Promise.all([
    getWorkspaceId(accountA, userA.id, "Account A"),
    getWorkspaceId(accountB, userB.id, "Account B"),
  ]);
  assert(workspaceA !== workspaceB, "the accounts belong to separate workspaces");

  const projectA = await createProject(accountA, workspaceA, `A-${suffix}`, createdByA);
  const projectB = await createProject(accountB, workspaceB, `B-${suffix}`, createdByB);

  const { data: visibleToB, error: readError } = await accountB
    .from("projects")
    .select("id")
    .eq("id", projectA.id);
  if (readError) throw new Error(`Cross-workspace read returned an unexpected error: ${readError.message}`);
  assert((visibleToB ?? []).length === 0, "Account B cannot read Account A's project");

  const { data: updateRows, error: updateError } = await accountB
    .from("projects")
    .update({ name: `TAMPERED-${suffix}` })
    .eq("id", projectA.id)
    .select("id");
  if (updateError) throw new Error(`Cross-workspace update returned an unexpected error: ${updateError.message}`);
  assert((updateRows ?? []).length === 0, "Account B cannot update Account A's project");

  const { data: deleteRows, error: deleteError } = await accountB
    .from("projects")
    .delete()
    .eq("id", projectA.id)
    .select("id");
  if (deleteError) throw new Error(`Cross-workspace delete returned an unexpected error: ${deleteError.message}`);
  assert((deleteRows ?? []).length === 0, "Account B cannot delete Account A's project");

  const { data: forgedInsert, error: forgedInsertError } = await accountB
    .from("projects")
    .insert({ workspace_id: workspaceA, name: `FORGED-${suffix}`, status: "planning" })
    .select("id")
    .maybeSingle();
  assert(Boolean(forgedInsertError) || !forgedInsert, "Account B cannot create a project in Account A's workspace");

  const { data: intactA, error: verifyAError } = await accountA
    .from("projects")
    .select("id,name")
    .eq("id", projectA.id)
    .single();
  if (verifyAError) throw new Error(`Account A could not verify its project: ${verifyAError.message}`);
  assert(intactA.name === projectA.name, "Account A's project remains unchanged after Account B's attempts");

  const { data: ownB, error: ownBError } = await accountB
    .from("projects")
    .select("id")
    .eq("id", projectB.id)
    .single();
  if (ownBError || !ownB) throw new Error(`Account B cannot read its own project: ${ownBError?.message ?? "not found"}`);
  assert(true, "Account B can read its own project");
  console.log("\nWorkspace RLS integration checks passed.");
} finally {
  if (createdByA.length) {
    const { error } = await accountA.from("projects").delete().in("id", createdByA);
    if (error) console.error(`Cleanup warning for Account A: ${error.message}`);
  }
  if (createdByB.length) {
    const { error } = await accountB.from("projects").delete().in("id", createdByB);
    if (error) console.error(`Cleanup warning for Account B: ${error.message}`);
  }
  await Promise.all([accountA.auth.signOut(), accountB.auth.signOut()]);
}
