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
  TIdentityId,
  IMask,
  err,
  ErrorCode,
  IAssetData,
  TOKENS,
  TAccountId,
} from "@fort-major/masquerade-shared";
import { generateRandomPseudonym, getSignIdentity } from "./utils";

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
  public async getOriginData(origin: TOrigin): Promise<IOriginData> {
    let originData = this.state.originData[origin];

    if (originData === undefined) {
      const mask = await this.makeMask(origin, 0);
      originData = makeDefaultOriginData(mask);
    }

    return originData;
  }

  public setOriginData(origin: TOrigin, data: IOriginData): void {
    this.state.originData[origin] = data;
  }

  public getAllOriginData(): { [x: TOrigin]: IOriginData | undefined } {
    return this.state.originData;
  }

  public getAllAssetData(): { [x: string]: IAssetData | undefined } {
    return this.state.assetData;
  }

  public editPseudonym(origin: TOrigin, identityId: TIdentityId, newPseudonym: string) {
    const originData = this.state.originData[origin];

    if (originData === undefined) {
      err(ErrorCode.INVALID_INPUT, `No origin data exists ${origin}`);
    }

    if (originData.masks.length <= identityId) {
      err(ErrorCode.INVALID_INPUT, `No mask exists ${identityId}`);
    }

    originData.masks[identityId].pseudonym = newPseudonym;
  }

  public linkExists(from: TOrigin, to: TOrigin): boolean {
    const fromHasToLink = this.state.originData[from]?.linksTo?.includes(to) ?? false;
    const toHasFromLink = this.state.originData[to]?.linksFrom?.includes(from) ?? false;

    if ((fromHasToLink && !toHasFromLink) || (!fromHasToLink && toHasFromLink)) {
      unreacheable("There should always be two sides of a link");
    }

    return fromHasToLink;
  }

  public async link(from: TOrigin, to: TOrigin): Promise<void> {
    const fromOriginData = await this.getOriginData(from);
    const toOriginData = await this.getOriginData(to);

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

  public async unlink(from: TOrigin, to: TOrigin): Promise<void> {
    const fromOriginData = await this.getOriginData(from);
    const toOriginData = await this.getOriginData(to);

    const fromIdx = fromOriginData.linksTo.findIndex((it) => it === to);
    const toIdx = toOriginData.linksFrom.findIndex((it) => it === from);

    if (fromIdx === -1 || toIdx === -1) unreacheable("To unlink there should be a link");

    fromOriginData.linksTo.splice(fromIdx, 1);
    toOriginData.linksFrom.splice(toIdx, 1);

    this.setOriginData(from, fromOriginData);
    this.setOriginData(to, toOriginData);
  }

  public async unlinkAll(from: TOrigin): Promise<TOrigin[]> {
    const fromOriginData = await this.getOriginData(from);

    for (let fromIdx = 0; fromIdx < fromOriginData.linksTo.length; fromIdx++) {
      const to = fromOriginData.linksTo[fromIdx];

      const toOriginData = await this.getOriginData(to);
      const toIdx = toOriginData.linksFrom.findIndex((it) => it === from);

      toOriginData.linksFrom.splice(toIdx, 1);
      this.setOriginData(to, toOriginData);
    }

    const oldLinks = fromOriginData.linksTo;
    fromOriginData.linksTo = [];
    this.setOriginData(from, fromOriginData);

    return oldLinks;
  }

  public async addIdentity(origin: TOrigin): Promise<IMask> {
    let originData = this.state.originData[origin];

    if (originData === undefined) {
      const mask = await this.makeMask(origin, 0);
      originData = makeDefaultOriginData(mask);
    }

    const mask = await this.makeMask(origin, originData.masks.length);
    originData.masks.push(mask);

    this.state.originData[origin] = originData;

    return mask;
  }

  public addAsset(assetId: string): IAssetData {
    let assetData = this.state.assetData[assetId];

    if (assetData !== undefined) return assetData;

    assetData = makeDefaultAssetData();

    this.state.assetData[assetId] = assetData;

    return assetData;
  }

  public addAssetAccount(assetId: string): string {
    const assetData = this.state.assetData[assetId];

    if (assetData === undefined) unreacheable(`No asset exists ${assetId}`);

    const name = `Account #${assetData.accounts.length}`;
    assetData.accounts.push(name);

    return name;
  }

  public editAssetAccount(assetId: string, accountId: TAccountId, newName: string) {
    const assetData = this.state.assetData[assetId];

    if (assetData === undefined) unreacheable(`No asset exists ${assetId}`);
    if (assetData.accounts.length <= accountId) unreacheable(`No account exists ${assetId} ${accountId}`);

    assetData.accounts[accountId] = newName;
  }

  private async makeMask(origin: TOrigin, identityId: TIdentityId): Promise<IMask> {
    const identity = await getSignIdentity(origin, identityId, new Uint8Array());
    const principal = identity.getPrincipal();
    const prinBytes = principal.toUint8Array();
    const seed1 = prinBytes[3];
    const seed2 = prinBytes[4];

    return { pseudonym: generateRandomPseudonym(seed1, seed2), principal: principal.toText() };
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
  assetData: Object.values(TOKENS).reduce(
    (prev, cur) => ({ ...prev, [cur]: makeDefaultAssetData() }),
    {} as Record<string, IAssetData>,
  ),
  statistics: {
    lastResetTimestamp: Date.now(),
    dev: 0,
    prod: 0,
  },
});

const makeDefaultOriginData: (mask: IMask) => IOriginData = (mask) => ({
  masks: [mask],
  currentSession: undefined,
  linksFrom: [],
  linksTo: [],
});

const makeDefaultAssetData: () => IAssetData = () => ({
  accounts: ["Main"],
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
