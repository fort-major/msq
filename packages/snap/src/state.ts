import {
  type IOriginData,
  type IState,
  type IStatistics,
  type TOrigin,
  unreacheable,
  zodParse,
  ZState,
  fromCBOR,
  toCBOR,
} from "@fort-major/masquerade-shared";

/**
 * Provides a higher-level interface for interacting with the snap's state.
 *
 * @keywords state, memory, data, persistence
 */
export class StateManager {
  /**
   * @param origin - origin to get data about
   * @returns - existing links, current session and a total number of user identities
   */
  public getOriginData(origin: TOrigin): IOriginData {
    return this.state.originData[origin] ?? makeDefaultOriginData();
  }

  public setOriginData(origin: TOrigin, data: IOriginData): void {
    this.state.originData[origin] = data;
  }

  public linkExists(from: TOrigin, to: TOrigin): boolean {
    const fromHasToLink = this.state.originData[from]?.linksTo?.includes(to) ?? false;
    const toHasFromLink = this.state.originData[to]?.linksFrom?.includes(from) ?? false;

    if ((fromHasToLink && !toHasFromLink) || (!fromHasToLink && toHasFromLink)) {
      unreacheable("There should always be two sides of a link");
    }

    return fromHasToLink;
  }

  public link(from: TOrigin, to: TOrigin): void {
    const fromOriginData = this.getOriginData(from);
    const toOriginData = this.getOriginData(to);

    if (fromOriginData.linksTo.includes(to)) {
      unreacheable(`Unable to add an existing TO link: ${from} -> ${to}`);
    }
    if (toOriginData.linksFrom.includes(from)) {
      unreacheable(`Unable to add an existing FROM link: ${from} -> ${to}`);
    }

    fromOriginData.linksTo.push(to);
    toOriginData.linksFrom.push(from);

    this.setOriginData(from, fromOriginData);
    this.setOriginData(to, toOriginData);
  }

  public unlink(from: TOrigin, to: TOrigin): void {
    const fromOriginData = this.getOriginData(from);
    const toOriginData = this.getOriginData(to);

    const fromIdx = fromOriginData.linksTo.findIndex((it) => it === to);
    const toIdx = toOriginData.linksFrom.findIndex((it) => it === from);

    if (fromIdx === -1 || toIdx === -1) unreacheable("To unlink there should be a link");

    fromOriginData.linksTo.splice(fromIdx, 1);
    toOriginData.linksFrom.splice(toIdx, 1);

    this.setOriginData(from, fromOriginData);
    this.setOriginData(to, toOriginData);
  }

  public addIdentity(origin: TOrigin): void {
    const originData = this.state.originData[origin] ?? makeDefaultOriginData();
    originData.identitiesTotal += 1;

    this.state.originData[origin] = originData;
  }

  constructor(private readonly state: IState) {}

  public static async make(): Promise<StateManager> {
    const state = await retrieveStateLocal();

    return new StateManager(state);
  }

  public async persist(): Promise<void> {
    await persistStateLocal(this.state);
  }

  public incrementStats(origin: TOrigin): void {
    const url = new URL(origin);

    let kind: "prod" | "dev" = "prod";

    if (url.protocol === "http") {
      kind = "dev";
    } else if (IP_V4.test(url.hostname)) {
      kind = "dev";
    } else if (url.hostname.includes("localhost")) {
      kind = "dev";
    }

    this.state.statistics[kind] += 1;
  }

  public getStats(): IStatistics {
    return this.state.statistics;
  }

  public resetStats(): void {
    const now = Date.now();

    this.state.statistics = {
      lastResetTimestamp: now,
      dev: 0,
      prod: 0,
    };
  }
}

const IP_V4 = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm;

const makeDefaultState: () => IState = () => ({
  version: 1,
  originData: {},
  statistics: {
    lastResetTimestamp: Date.now(),
    dev: 0,
    prod: 0,
  },
});

const makeDefaultOriginData: () => IOriginData = () => ({
  identitiesTotal: 1,
  currentSession: undefined,
  linksFrom: [],
  linksTo: [],
});

export async function retrieveStateLocal(): Promise<IState> {
  const state = await snap.request({
    method: "snap_manageState",
    params: {
      operation: "get",
    },
  });

  if (state == null) {
    const s = makeDefaultState();
    await persistStateLocal(s);

    return s;
  }

  return zodParse(ZState, fromCBOR(state.data as string));
}

export async function persistStateLocal(state: IState): Promise<void> {
  await snap.request({
    method: "snap_manageState",
    params: {
      operation: "update",
      newState: { data: toCBOR(state) },
    },
  });
}
