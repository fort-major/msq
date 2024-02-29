import { For, Show, createResource } from "solid-js";
import { createStatisticsBackendActor } from "../../backend";
import { makeAnonymousAgent, timestampToStr } from "../../utils";
import { Line } from "solid-chartjs";
import { COLOR_ACCENT } from "../../ui-kit";
import { Stat, StatsWrapper } from "./style";
import { Text } from "../../ui-kit/typography";
import { log } from "@fort-major/msq-shared";

interface IStat {
  labels: string[];
  datasets: { label: string; data: number[] }[];
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
      const time = timestampToStr(Math.floor(Number(episode.timestamp / BigInt(1000000))));

      result.login.labels.push(time);
      result.login.datasets[0].data.push(episode.data.login);

      result.transfer.labels.push(time);
      result.transfer.datasets[0].data.push(episode.data.transfer);

      result.origin_link.labels.push(time);
      result.origin_link.datasets[0].data.push(episode.data.origin_link);

      result.origin_unlink.labels.push(time);
      result.origin_unlink.datasets[0].data.push(episode.data.origin_unlink);
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
