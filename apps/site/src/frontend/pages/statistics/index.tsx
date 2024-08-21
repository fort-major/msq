import { For, Show, createResource } from "solid-js";
import { createStatisticsBackendActor } from "../../backend";
import { makeAnonymousAgent, monthToStr } from "../../utils";
import { Line } from "solid-chartjs";
import { COLOR_ACCENT } from "../../ui-kit";
import { Stat, StatsWrapper } from "./style";
import { Text } from "../../ui-kit/typography";

interface IStat {
  labels: string[];
  datasets: { label: string; data: number[] }[];
  last?: { m: number; y: number };
}

function makeDefaultStat(label: string): IStat {
  return {
    labels: [],
    datasets: [
      {
        label,
        data: [],
        // @ts-expect-error
        backgroundColor: COLOR_ACCENT,
      },
    ],
  };
}

interface IStatisticsUnwrapped {
  login: IStat;
  transfer: IStat;
  origin_link: IStat;
  origin_unlink: IStat;
}

export function StatisticsPage() {
  const [stats] = createResource<IStatisticsUnwrapped | null>(async () => {
    const agent = await makeAnonymousAgent(import.meta.env.VITE_MSQ_DFX_NETWORK_HOST);

    const actor = createStatisticsBackendActor(agent);
    const statisticsHistory = await actor.get_stats();

    const result: IStatisticsUnwrapped = {
      login: makeDefaultStat("Log in attempts"),
      transfer: makeDefaultStat("Successful transfers"),
      origin_link: makeDefaultStat("Origin Links Created"),
      origin_unlink: makeDefaultStat("Origin Links Removed"),
    };

    for (let episode of statisticsHistory) {
      const timestampMs = Math.floor(Number(episode.timestamp / 1000000n));
      const date = new Date(timestampMs);
      const label = `${monthToStr(date.getMonth())} ${date.getFullYear()}`;

      if (episode.data.login > 0) {
        if (
          result.login.last &&
          result.login.last.m === date.getMonth() &&
          result.login.last.y === date.getFullYear()
        ) {
          result.login.datasets[0].data[result.login.datasets[0].data.length] += episode.data.login;
        } else {
          result.login.last = { m: date.getMonth(), y: date.getFullYear() };
          result.login.labels.push(label);
          result.login.datasets[0].data.push(episode.data.login);
        }
      }

      if (episode.data.transfer > 0) {
        if (
          result.transfer.last &&
          result.transfer.last.m === date.getMonth() &&
          result.transfer.last.y === date.getFullYear()
        ) {
          result.transfer.datasets[0].data[result.transfer.datasets[0].data.length] += episode.data.transfer;
        } else {
          result.transfer.last = { m: date.getMonth(), y: date.getFullYear() };
          result.transfer.labels.push(label);
          result.transfer.datasets[0].data.push(episode.data.transfer);
        }
      }

      if (episode.data.origin_link > 0) {
        if (
          result.origin_link.last &&
          result.origin_link.last.m === date.getMonth() &&
          result.origin_link.last.y === date.getFullYear()
        ) {
          result.origin_link.datasets[0].data[result.origin_link.datasets[0].data.length] += episode.data.origin_link;
        } else {
          result.origin_link.last = { m: date.getMonth(), y: date.getFullYear() };
          result.origin_link.labels.push(label);
          result.origin_link.datasets[0].data.push(episode.data.origin_link);
        }
      }

      if (episode.data.origin_unlink > 0) {
        if (
          result.origin_unlink.last &&
          result.origin_unlink.last.m === date.getMonth() &&
          result.origin_unlink.last.y === date.getFullYear()
        ) {
          result.origin_unlink.datasets[0].data[result.origin_unlink.datasets[0].data.length] +=
            episode.data.origin_unlink;
        } else {
          result.origin_unlink.last = { m: date.getMonth(), y: date.getFullYear() };
          result.origin_unlink.labels.push(label);
          result.origin_unlink.datasets[0].data.push(episode.data.origin_unlink);
        }
      }
    }

    return result;
  });

  const chartOptions = {
    responsive: false,
  };

  return (
    <Show when={stats() != null}>
      <StatsWrapper>
        <For each={Object.values(stats()!)}>
          {(stat: IStat) => (
            <Stat>
              <Text size={24}>{stat.datasets[0].label}</Text>
              <Line
                plugins={{ colors: { enabled: true } }}
                data={stat}
                options={chartOptions}
                width={500}
                height={500}
              />
            </Stat>
          )}
        </For>
      </StatsWrapper>
    </Show>
  );
}
