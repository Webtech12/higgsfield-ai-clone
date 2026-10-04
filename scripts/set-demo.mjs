// Makes one finished film the public demo (readable by anyone, writable by no one: AGENTS.md §5)
// and unsets any previous demo, in one transaction. Against production:
//   npm run demo:prod -- <projectId>     (reads .env.prod)
import pg from "pg";

const projectId = process.argv[2];
if (!projectId) {
  console.error("Usage: npm run demo:prod -- <projectId>");
  process.exit(1);
}
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("No database URL: set DATABASE_URL_UNPOOLED or DATABASE_URL.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("begin");
  const { rows } = await client.query(
    "select title, status from projects where id = $1 for update",
    [projectId],
  );
  const film = rows[0];
  if (!film) throw new Error(`There's no project ${projectId}.`);
  if (film.status !== "ready") {
    throw new Error(`Only a finished film can be the demo; this one is "${film.status}".`);
  }
  // Bumping the version changes the workspace ETag, so open pages pick up the new state.
  await client.query(
    `update projects set is_demo = (id = $1), version = version + 1, updated_at = now()
      where is_demo or id = $1`,
    [projectId],
  );
  await client.query("commit");
  console.log(`The demo film is now "${film.title}" (${projectId}).`);
} catch (error) {
  await client.query("rollback");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
