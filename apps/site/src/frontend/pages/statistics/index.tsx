import { For, Show, createResource, createSignal, onMount } from "solid-js";
import { useIcAgent } from "../../store/global";
import { createStatisticsBackendActor } from "../../backend";
import { HttpAgent } from "@dfinity/agent";
import { timestampToStr } from "../../utils";
import { Chart, Title, Tooltip, Legend, Colors } from "chart.js";
import { Line } from "solid-chartjs";

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
      },
    ],
  };
}

interface IStatisticsUnwrapped {
  masks_created: IStat;
  signatures_produced: IStat;
  origins_linked: IStat;
  origins_unlinked: IStat;
  icrc1_accounts_created: IStat;
  icp_sent: IStat;
  ckBtc_sent: IStat;
  chat_sent: IStat;
  sonic_sent: IStat;
  sns1_sent: IStat;
  ogy_sent: IStat;
  mod_sent: IStat;
  ghost_sent: IStat;
  kinic_sent: IStat;
  hot_sent: IStat;
  cat_sent: IStat;
}

export function StatisticsPage() {
  const icAgent = useIcAgent();

  const [stats, setStats] = createResource<IStatisticsUnwrapped | null, HttpAgent, unknown>(icAgent, async (agent) => {
    if (agent === null) return null;

    const actor = createStatisticsBackendActor(agent);
    const statisticsHistory = await actor.get_stats();

    console.log(statisticsHistory);

    const result: IStatisticsUnwrapped = {
      masks_created: makeDefaultStat("Masks Created"),
      signatures_produced: makeDefaultStat("Signatures Produced"),
      origins_linked: makeDefaultStat("Origin Links Created"),
      origins_unlinked: makeDefaultStat("Origin Links Destroyed"),
      icrc1_accounts_created: makeDefaultStat("ICRC-1 Accounts Created"),
      icp_sent: makeDefaultStat("ICP Sent"),
      ckBtc_sent: makeDefaultStat("ckBTC Sent"),
      chat_sent: makeDefaultStat("CHAT Sent"),
      sonic_sent: makeDefaultStat("SONIC Sent"),
      sns1_sent: makeDefaultStat("SNS1 Sent"),
      ogy_sent: makeDefaultStat("OGY Sent"),
      mod_sent: makeDefaultStat("MOD Sent"),
      ghost_sent: makeDefaultStat("GHOST Sent"),
      kinic_sent: makeDefaultStat("KINIC Sent"),
      hot_sent: makeDefaultStat("HOT Sent"),
      cat_sent: makeDefaultStat("CAT Sent"),
    };

    for (let episode of statisticsHistory) {
      const time = timestampToStr(Math.floor(Number(episode.timestamp / BigInt(1000000))));

      result.masks_created.labels.push(time);

      result.masks_created.datasets[0].data.push(episode.prod.masks_created);
      result.signatures_produced.datasets[0].data.push(episode.prod.signatures_produced);
      result.origins_linked.datasets[0].data.push(episode.prod.origins_linked);
      result.origins_unlinked.datasets[0].data.push(episode.prod.origins_unlinked);
      result.icrc1_accounts_created.datasets[0].data.push(episode.prod.icrc1_accounts_created);

      result.icp_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.ICP / BigInt(100000000)));
      result.ckBtc_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.ckBTC / BigInt(100000000)));
      result.chat_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.CHAT / BigInt(100000000)));
      result.sonic_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.SONIC / BigInt(100000000)));
      result.sns1_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.SNS1 / BigInt(100000000)));
      result.ogy_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.OGY / BigInt(100000000)));
      result.mod_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.MOD / BigInt(100000000)));
      result.ghost_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.GHOST / BigInt(100000000)));
      result.kinic_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.KINIC / BigInt(100000000)));
      result.hot_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.HOT / BigInt(100000000)));
      result.cat_sent.datasets[0].data.push(Number(episode.prod.icrc1_sent.CAT / BigInt(100000000)));
    }

    console.log(result);

    return result;
  });

  const chartOptions = {
    responsive: false,
  };

  return (
    <Show when={stats() != null}>
      <For each={Object.values(stats()!)}>
        {(stat: IStat) => <Line data={stat} options={chartOptions} width={500} height={500} />}
      </For>
    </Show>
  );
}
