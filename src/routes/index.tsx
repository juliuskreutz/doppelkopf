import { createAsync } from "@solidjs/router";
import { Chart } from "chart.js/auto";
import { eq } from "drizzle-orm";
import { For, onMount } from "solid-js";
import { db } from "~/db";
import {
  gamePlayersTable,
  gamesTable,
  playersTable,
  sessionPlayersTable,
} from "~/db/schema";

async function getPlayerData() {
  "use server";

  const players = new Map<
    number,
    {
      name: string;
      points: number[];
      pointsNoRam: number;
      games: number;
      wins: number;
      solosWon: number;
      solosLost: number;
    }
  >();

  for (const player of await db.select().from(playersTable)) {
    players.set(player.id, {
      name: player.name,
      points: [0],
      pointsNoRam: 0,
      games: 0,
      wins: 0,
      solosWon: 0,
      solosLost: 0,
    });
  }

  const sessionPlayers = new Map<number, number[]>();

  for (const sessionPlayer of await db
    .select({
      session: sessionPlayersTable.session,
      player: sessionPlayersTable.player,
    })
    .from(sessionPlayersTable)) {
    const players = sessionPlayers.get(sessionPlayer.session) || [];
    players.push(sessionPlayer.player);
    sessionPlayers.set(sessionPlayer.session, players);
  }

  const sessionRams = new Map<number, number[]>();

  for (const game of await db
    .select({
      id: gamesTable.id,
      type: gamesTable.type,
      session: gamesTable.session,
      points: gamesTable.points,
      ram: gamesTable.ram,
    })
    .from(gamesTable)) {
    const gameSessionPlayers = sessionPlayers.get(game.session)!;

    const gamePlayers = await db
      .select({
        player: gamePlayersTable.player,
        winner: gamePlayersTable.winner,
      })
      .from(gamePlayersTable)
      .where(eq(gamePlayersTable.game, game.id));

    const mult = 2 ** (sessionRams.get(game.session)?.length || 0);

    const winners = gamePlayers.filter((p) => p.winner).map((p) => p.player);
    const losers = gamePlayers.filter((p) => !p.winner).map((p) => p.player);
    const skips = players
      .keys()
      .filter((p) => !(winners.includes(p) || losers.includes(p)));

    for (const winner of winners) {
      let points = game.points;

      if (winners.length === 1) points *= 3;

      const player = players.get(winner)!;
      player.points.push(player.points.at(-1)! + points * mult);
      player.pointsNoRam += points;
      player.wins += 1;
      player.games += 1;

      if (winners.length === 1) {
        player.solosWon += 1;
      }

      players.set(winner, player);
    }

    for (const loser of losers) {
      let points = game.points;

      if (losers.length === 1) points *= 3;

      const player = players.get(loser)!;
      player.points.push(player.points.at(-1)! - points * mult);
      player.pointsNoRam -= points;
      player.games += 1;

      if (losers.length === 1) {
        player.solosLost += 1;
      }

      players.set(loser, player);
    }

    for (const skip of skips) {
      const player = players.get(skip)!;
      player.points.push(player.points.at(-1)!);
      players.set(skip, player);
    }

    const rams = (sessionRams.get(game.session) || [])
      .map((i) => i - 1)
      .filter((i) => i > 0);
    if (game.ram) {
      rams.push(gameSessionPlayers.length);
    }
    sessionRams.set(game.session, rams);
  }

  const data = players.values().toArray();

  data.sort((a, b) => b.points.at(-1)! - a.points.at(-1)!);

  return data;
}

export default function Home() {
  const playerData = createAsync(getPlayerData);

  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    const pd = playerData()!;

    const length = pd[0]?.points.length || 0;

    const data = {
      labels: [...Array(length).keys()],
      datasets: pd.map((p) => {
        return {
          label: p.name,
          data: p.points,
        };
      }),
    };

    new Chart(canvas!, { type: "line", data });
  });

  return (
    <main>
      <div class="container">
        <h1>Points</h1>
        <div class="row">
          <div class="table col-6">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Points</th>
                  <th>Points (No Ram)</th>
                </tr>
              </thead>
              <tbody>
                <For each={playerData()}>
                  {(player, i) => (
                    <tr>
                      <td>{i() + 1}</td>
                      <td>{player.name}</td>
                      <td>{player.points.at(-1)}</td>
                      <td>{player.pointsNoRam}</td>
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

        <h1>Stats</h1>
        <div class="table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Games</th>
                <th>Wins</th>
                <th>Win Rate</th>
                <th>Solos Won</th>
                <th>Solos Lost</th>
              </tr>
            </thead>
            <tbody>
              <For each={playerData()}>
                {(player) => (
                  <tr>
                    <td>{player.name}</td>
                    <td>{player.games}</td>
                    <td>{player.wins}</td>
                    <td>{((player.wins * 100) / player.games).toFixed(1)}%</td>
                    <td>{player.solosWon}</td>
                    <td>{player.solosLost}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
