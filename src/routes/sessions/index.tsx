import { createAsync, query, revalidate, useNavigate } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { createSignal, For, Show } from "solid-js";
import { db } from "~/db";
import { playersTable, sessionPlayersTable, sessionsTable } from "~/db/schema";

const getSessions = query(async () => {
  "use server";

  const sessions = [];

  for (const session of await db
    .select()
    .from(sessionsTable)
    .orderBy(sessionsTable.id)) {
    const sessionPlayers = await db
      .select({ name: playersTable.name })
      .from(sessionPlayersTable)
      .innerJoin(playersTable, eq(sessionPlayersTable.player, playersTable.id))
      .where(eq(sessionPlayersTable.session, session.id));

    sessions.push({
      id: session.id,
      createdAt: new Date(`${session.createdAt}Z`),
      players: sessionPlayers.map((p) => p.name),
    });
  }

  return sessions;
}, "sessions");

async function getPlayers() {
  "use server";

  return await db.select().from(playersTable);
}

async function createSession(players: number[]) {
  "use server";

  const session = (
    await db
      .insert(sessionsTable)
      .values({})
      .returning({ id: sessionsTable.id })
  )[0].id;

  for (const player of players) {
    await db.insert(sessionPlayersTable).values({ session, player });
  }

  return session;
}

async function deleteSession(session: number) {
  "use server";

  await db.delete(sessionsTable).where(eq(sessionsTable.id, session));
}

export default function Sessions() {
  const navigate = useNavigate();

  const sessions = createAsync(() => getSessions());
  const players = createAsync(getPlayers);

  const [session, setSession] = createSignal(0);
  const [order, setOrder] = createSignal<{ id: number; name: string }[]>([]);

  return (
    <main>
      <div class="container">
        <h1>Sessions</h1>
        <div>
          <div class="table">
            <table>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Players</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={sessions()}>
                  {(session) => (
                    <tr>
                      <td>{session.id}</td>
                      <td>{session.players.join(", ")}</td>
                      <td>{session.createdAt.toLocaleString()}</td>
                      <td>
                        <menu class="buttons">
                          <a
                            type="button"
                            href={`/sessions/${session.id}`}
                            class="ghost small"
                          >
                            Play
                          </a>

                          <button
                            type="button"
                            class="ghost small"
                            data-variant="danger"
                            commandfor="delete-dialog"
                            command="show-modal"
                            onclick={() => setSession(session.id)}
                          >
                            Delete
                          </button>
                        </menu>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>

        <button
          type="button"
          class="outline w-100"
          commandfor="create-dialog"
          command="show-modal"
          onclick={() => setOrder([])}
        >
          +
        </button>
      </div>

      <dialog id="create-dialog">
        <form
          method="dialog"
          onsubmit={async () => {
            const session = await createSession(order().map((p) => p.id));
            navigate(`/sessions/${session}`);
          }}
        >
          <header>
            <h3>Create Session</h3>
          </header>
          <div class="hstack">
            <For each={players()}>
              {(player) => (
                <Show when={!order().find((p) => p.id === player.id)}>
                  <button
                    type="button"
                    class="outline"
                    onclick={() => setOrder((o) => [...o, player])}
                  >
                    {player.name}
                  </button>
                </Show>
              )}
            </For>
          </div>
          <div class="vstack">
            Order
            <div class="hstack">
              <For each={order()}>
                {(player) => (
                  <button
                    type="button"
                    onclick={() =>
                      setOrder((o) => o.filter((p) => p.id !== player.id))
                    }
                  >
                    {player.name}
                  </button>
                )}
              </For>
            </div>
          </div>
          <footer>
            <button
              type="button"
              commandfor="create-dialog"
              command="close"
              class="outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!(order().length === 4 || order().length === 5)}
            >
              Create
            </button>
          </footer>
        </form>
      </dialog>

      <dialog id="delete-dialog">
        <form
          method="dialog"
          onsubmit={async () => {
            await deleteSession(session());
            await revalidate(getSessions.key);
          }}
        >
          <header>
            <h3>Delete Session {session()}</h3>
          </header>
          <p>
            This will delete all of the games connected played in this session!
          </p>
          <footer>
            <button
              type="button"
              commandfor="delete-dialog"
              command="close"
              class="outline"
            >
              Cancel
            </button>
            <button type="submit" data-variant="danger">
              Delete
            </button>
          </footer>
        </form>
      </dialog>
    </main>
  );
}
