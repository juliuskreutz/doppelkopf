import { createAsync, query, revalidate, useParams } from "@solidjs/router";
import { Chart } from "chart.js/auto";
import { eq } from "drizzle-orm";
import { createEffect, createSignal, For, Show } from "solid-js";
import { db } from "~/db";
import {
  gamePlayersTable,
  gamesTable,
  playersTable,
  sessionPlayersTable,
} from "~/db/schema";

const getGames = query(async (session: number) => {
  "use server";

  const order = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(sessionPlayersTable)
    .innerJoin(playersTable, eq(sessionPlayersTable.player, playersTable.id))
    .where(eq(sessionPlayersTable.session, session))
    .orderBy(sessionPlayersTable.id);

  const playerPoints = new Map<number, { name: string; points: number[] }>();

  for (const player of order) {
    playerPoints.set(player.id, { name: player.name, points: [0] });
  }

  let dealerI = 0;
  let dealer = order[dealerI];
  let rams: number[] = [];
  const games = [];

  for (const game of await db
    .select({
      id: gamesTable.id,
      type: gamesTable.type,
      points: gamesTable.points,
      ram: gamesTable.ram,
    })
    .from(gamesTable)
    .where(eq(gamesTable.session, session))
    .orderBy(gamesTable.id)) {
    if (!(order.length === 4 && game.type === "solo")) {
      dealerI++;
      dealerI %= order.length;
    }

    const players = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        winner: gamePlayersTable.winner,
      })
      .from(gamePlayersTable)
      .innerJoin(playersTable, eq(gamePlayersTable.player, playersTable.id))
      .where(eq(gamePlayersTable.game, game.id));

    const mult = 2 ** (rams.length || 0);
    const points = game.points * mult;

    const winners = players.filter((p) => p.winner).map((p) => p.id);
    const losers = players.filter((p) => !p.winner).map((p) => p.id);
    const skips = order
      .map((p) => p.id)
      .filter((p) => !(winners.includes(p) || losers.includes(p)));

    for (const winner of winners) {
      const player = playerPoints.get(winner)!;
      player.points.push(
        player.points.at(-1)! + (points * losers.length) / winners.length,
      );
      playerPoints.set(winner, player);
    }

    for (const loser of losers) {
      const player = playerPoints.get(loser)!;
      player.points.push(player.points.at(-1)! - points);
      playerPoints.set(loser, player);
    }

    for (const skip of skips) {
      const player = playerPoints.get(skip)!;
      player.points.push(player.points.at(-1)!);
      playerPoints.set(skip, player);
    }

    rams = rams.map((i) => i - 1).filter((i) => i > 0);
    if (game.ram) {
      rams.push(order.length);
    }

    games.push({
      id: game.id,
      type: game.type,
      points: game.points,
      ram: game.ram,
      dealer,
      mult,
      players,
    });

    dealer = order[dealerI];
  }

  const players = playerPoints.values().toArray();
  players.sort((a, b) => b.points.at(-1)! - a.points.at(-1)!);

  return { order, games, players, dealer };
}, "games");

async function createGame(
  session: number,
  type: "normal" | "solo" | "silent",
  points: number,
  ram: boolean,
  winners: number[],
  losers: number[],
) {
  "use server";

  const game = (
    await db
      .insert(gamesTable)
      .values({ session, type, points, ram })
      .returning({ id: gamesTable.id })
  )[0].id;

  for (const winner of winners) {
    await db
      .insert(gamePlayersTable)
      .values({ game, player: winner, winner: true });
  }

  for (const loser of losers) {
    await db
      .insert(gamePlayersTable)
      .values({ game, player: loser, winner: false });
  }
}

async function updateGame(game: number, points: number, ram: boolean) {
  "use server";

  await db
    .update(gamesTable)
    .set({ points, ram })
    .where(eq(gamesTable.id, game));
}

async function deleteGame(game: number) {
  "use server";

  await db.delete(gamesTable).where(eq(gamesTable.id, game));
}

export default function Session() {
  const params = useParams();
  const session = parseInt(params.session!, 10);

  const games = createAsync(() => getGames(session));

  const [game, setGame] = createSignal(0);
  const [type, setType] = createSignal<"normal" | "solo" | "silent">("normal");
  const [dealer, setDealer] = createSignal({ id: 0, name: "" });
  const [points, setPoints] = createSignal<number | undefined>(undefined);
  const [winners, setWinners] = createSignal<number[]>([]);
  const [ram, setRam] = createSignal(false);

  let canvas: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  createEffect(() => {
    const g = games();

    if (!g || !canvas) {
      return;
    }

    const length = g.players[0]?.points.length || 0;

    const data = {
      labels: [...Array(length).keys()],
      datasets: g.players.map((p) => {
        return { label: p.name, data: p.points };
      }),
    };

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(canvas!, { type: "line", data });
  });

  function getTypeBadge(type: "normal" | "solo" | "silent") {
    switch (type) {
      case "normal":
        return <span class="badge outline">Normal</span>;
      case "solo":
        return <span class="badge">Solo</span>;
      case "silent":
        return <span class="badge secondary">Silent</span>;
    }
  }

  function getMultBadge(mult: number) {
    if (mult >= 8) {
      return <span class="badge danger">{mult}x</span>;
    } else if (mult === 4) {
      return <span class="badge warning">4x</span>;
    } else if (mult === 2) {
      return <span class="badge success">2x</span>;
    } else {
      return <span class="badge outline">1x</span>;
    }
  }

  function getRamBadge(ram: boolean) {
    if (ram) {
      return <span class="badge success">✔</span>;
    } else {
      return <span class="badge danger">✘</span>;
    }
  }

  return (
    <main>
      <div class="container mb-6">
        <h1>Points</h1>
        <div class="row">
          <div class="table col-6">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                <For each={games()?.players}>
                  {({ name, points }, i) => (
                    <tr>
                      <td>{i() + 1}</td>
                      <td>{name}</td>
                      <td>{points.at(-1)}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <div class="col-6">
            <canvas ref={canvas}></canvas>
          </div>
        </div>

        <h1>Games (Dealer: {games()?.dealer.name})</h1>
        <div class="table">
          <table>
            <thead>
              <tr>
                <th>Id</th>
                <th>Dealer</th>
                <th>Type</th>
                <th>Points</th>
                <th>Mult</th>
                <th>Winners</th>
                <th>Losers</th>
                <th>Ram</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={games()?.games}>
                {(game, i) => (
                  <tr>
                    <td>{i() + 1}</td>
                    <td>{game.dealer.name}</td>
                    <td>{getTypeBadge(game.type)}</td>
                    <td>{game.points}</td>
                    <td>{getMultBadge(game.mult)}</td>
                    <td>
                      {game.players
                        .filter((p) => p.winner)
                        .map((p) => p.name)
                        .join(", ")}
                    </td>
                    <td>
                      {game.players
                        .filter((p) => !p.winner)
                        .map((p) => p.name)
                        .join(", ")}
                    </td>
                    <td>{getRamBadge(game.ram)}</td>
                    <td>
                      <menu class="buttons">
                        <button
                          type="button"
                          class="ghost small"
                          commandfor="game-dialog"
                          command="show-modal"
                          onclick={() => {
                            setGame(game.id);
                            setDealer(game.dealer);
                            setType(game.type);
                            setPoints(game.points);
                            setRam(game.ram);
                            setWinners(
                              game.players
                                .filter((p) => p.winner)
                                .map((p) => p.id),
                            );
                          }}
                        >
                          Edit
                        </button>

                        <Show when={i() === games()!.games.length - 1}>
                          <button
                            type="button"
                            class="ghost small"
                            data-variant="danger"
                            commandfor="delete-dialog"
                            command="show-modal"
                            onclick={() => setGame(game.id)}
                          >
                            Delete
                          </button>
                        </Show>
                      </menu>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <button
          type="button"
          class="outline w-100"
          commandfor="game-dialog"
          command="show-modal"
          onclick={() => {
            setGame(0);
            setDealer(games()!.dealer);
            setType("normal");
            setPoints(undefined);
            setRam(false);
            setWinners([]);
          }}
        >
          +
        </button>
      </div>

      <dialog id="game-dialog">
        <form
          method="dialog"
          onsubmit={async () => {
            if (game()) {
              await updateGame(game(), points()!, ram());
            } else {
              const losers = games()!
                .order.map((p) => p.id)
                .filter((p) => !(p === dealer().id || winners().includes(p)));

              await createGame(
                session,
                type(),
                points()!,
                ram(),
                winners(),
                losers,
              );
            }

            await revalidate("games");
          }}
        >
          <header>
            <h3>{game() ? "Edit Game" : "Create Game"}</h3>
          </header>

          <div>
            <fieldset class="hstack">
              <legend>Type</legend>
              <label>
                <input
                  type="radio"
                  name="type"
                  checked={type() === "normal"}
                  onchange={() => setType("normal")}
                  disabled={!!game()}
                />
                Normal
              </label>
              <label>
                <input
                  type="radio"
                  name="type"
                  checked={type() === "solo"}
                  onchange={() => setType("solo")}
                  disabled={!!game()}
                />
                Solo
              </label>
              <label>
                <input
                  type="radio"
                  name="type"
                  checked={type() === "silent"}
                  onchange={() => setType("silent")}
                  disabled={!!game()}
                />
                Silent
              </label>
            </fieldset>

            <fieldset class="vstack">
              <legend>Winners</legend>
              <menu class="buttons">
                <For each={games()?.order.filter((p) => p.id !== dealer().id)}>
                  {(player) => (
                    <button
                      type="button"
                      class={winners().includes(player.id) ? "" : "outline"}
                      onclick={() => {
                        if (winners().includes(player.id)) {
                          setWinners((w) => w.filter((w) => w !== player.id));
                        } else {
                          setWinners((w) => [...w, player.id]);
                        }
                      }}
                      disabled={!!game()}
                    >
                      {player.name}
                    </button>
                  )}
                </For>
              </menu>
            </fieldset>

            <label data-field>
              Points
              <input
                type="number"
                min="0"
                value={points()}
                oninput={(e) => {
                  if (e.target.value === "") {
                    setPoints(undefined);
                  } else {
                    setPoints(parseInt(e.target.value, 10));
                  }
                }}
              />
            </label>

            <label data-field>
              <input
                type="checkbox"
                checked={ram()}
                onchange={(e) => setRam(e.target.checked)}
              />{" "}
              Ram
            </label>
          </div>

          <footer>
            <button
              type="button"
              commandfor="game-dialog"
              command="close"
              class="outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                (type() === "normal" && winners().length !== 2) ||
                (type() !== "normal" &&
                  winners().length !== 1 &&
                  winners().length !== 3) ||
                points() === undefined
              }
            >
              {game() ? "Save" : "Create"}
            </button>
          </footer>
        </form>
      </dialog>

      <dialog id="delete-dialog">
        <form
          method="dialog"
          onsubmit={async () => {
            await deleteGame(game());
            await revalidate("games");
          }}
        >
          <header>
            <h3>Delete Game</h3>
          </header>
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
