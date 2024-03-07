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
  TAccountId,
  IStatisticsData,
} from "@fort-major/msq-shared";
import { generateRandomPseudonym, getSignIdentity } from "./utils";

/**
 * Provides a higher-level interface for interacting with the snap's state.
 *
 * @keywords state, memory, data, persistence
 */
export class StateManager {
  /**
   * Asynchronously retrieves origin data for a given origin from the state.
   * If the data for the specified origin does not exist in the state, it generates
   * a new mask for the origin using the `makeMask` function with a default parameter
   * of 0, and then creates default origin data using the `makeDefaultOriginData` function.
   * This ensures that every origin, whether previously stored or not, will have associated
   * data that can be retrieved.
   *
   * @param {TOrigin} origin - The origin for which to retrieve or create data.
   * @returns {Promise<IOriginData>} A promise that resolves to the data associated with the given origin.
   */
  public async getOriginData(origin: TOrigin): Promise<IOriginData> {
    let originData = this.state.originData[origin];

    if (originData === undefined) {
      const mask = await this.makeMask(origin, 0);
      originData = makeDefaultOriginData(mask);
    }

    return originData;
  }

  /**
   * Sets or updates the origin data in the state for a given origin.
   * This method directly assigns the provided data to the specified origin
   * within the `originData` property of the state. It is used to store or update
   * information related to a specific origin, ensuring that the state reflects
   * the most current data available.
   *
   * @param {TOrigin} origin - The origin for which to set the data.
   * @param {IOriginData} data - The data to set for the specified origin.
   */
  public setOriginData(origin: TOrigin, data: IOriginData): void {
    this.state.originData[origin] = data;
  }

  /**
   * Retrieves all origin data stored in the state.
   *
   * @returns {Record<TOrigin, IOriginData | undefined>} An object containing all origin data, with origin as the key and data as the value.
   */
  public getAllOriginData(): Record<TOrigin, IOriginData | undefined> {
    return this.state.originData;
  }

  /**
   * Retrieves all asset data stored in the state.
   *
   * @returns {Record<string, IAssetData | undefined>} An object containing all asset data, with asset ID as the key and data as the value.
   */
  public getAllAssetData(): Record<string, IAssetData | undefined> {
    return this.state.assetData;
  }

  /**
   * Edits the pseudonym for a given identity within the origin data stored in the state.
   * This method first checks if there is existing data for the specified origin. If not,
   * it throws an error indicating that no origin data exists. It then checks if a mask
   * exists for the given identity ID within the origin data. If a mask does not exist,
   * it throws an error indicating the absence of the mask. If both checks pass, it updates
   * the pseudonym for the specified identity ID within the origin data's masks to the
   * new pseudonym provided.
   *
   * Note: This method assumes that `err` is a function available in the context that
   * throws an error or otherwise handles error reporting based on an error code and message.
   *
   * @param {TOrigin} origin - The origin associated with the pseudonym to be edited.
   * @param {TIdentityId} identityId - The identity ID within the origin for which to edit the pseudonym.
   * @param {string} newPseudonym - The new pseudonym to set for the specified identity.
   * @throws Will throw an error if no origin data exists for the specified origin or if no mask exists for the given identity ID.
   */
  public editPseudonym(origin: TOrigin, identityId: TIdentityId, newPseudonym: string) {
    const originData = this.state.originData[origin];

    if (originData === undefined) {
      err(ErrorCode.INVALID_INPUT, `No origin data exists ${origin}`);
    }

    if (Object.keys(originData.masks).length <= identityId) {
      err(ErrorCode.INVALID_INPUT, `No mask exists ${identityId}`);
    }

    originData.masks[identityId]!.pseudonym = newPseudonym;
  }

  /**
   * Checks if a bidirectional link exists between two origins in the state.
   * This method verifies the existence of a link from 'from' origin to 'to' origin and vice versa.
   * It asserts that for a valid link, both sides (from -> to and to -> from) must acknowledge the link's existence.
   * If it finds an inconsistency, where one side recognizes the link while the other does not, it calls an
   * `unreacheable` function to indicate a critical logic error, as this scenario should never occur under correct operation.
   *
   * Note: The `unreacheable` function is assumed to be a mechanism for handling logic errors that should not happen.
   *
   * @param {TOrigin} from - The origin from which the link originates.
   * @param {TOrigin} to - The origin to which the link is directed.
   * @returns {boolean} True if a consistent, bidirectional link exists between the two origins; otherwise, it triggers an error.
   * @throws Triggers an error if a link exists in one direction without a corresponding link in the opposite direction, indicating a logic flaw.
   */
  public linkExists(from: TOrigin, to: TOrigin): boolean {
    const fromHasToLink = this.state.originData[from]?.linksTo[to] ?? false;
    const toHasFromLink = this.state.originData[to]?.linksFrom[from] ?? false;

    if ((fromHasToLink && !toHasFromLink) || (!fromHasToLink && toHasFromLink)) {
      unreacheable("There should always be two sides of a link");
    }

    return fromHasToLink;
  }

  /**
   * Creates a bidirectional link between two origins in the state.
   * This asynchronous method first retrieves the origin data for both the 'from' and 'to' origins.
   * It then checks if a link already exists from the 'from' origin to the 'to' origin or from the 'to'
   * origin back to the 'from' origin. If either link already exists, it calls an `unreacheable` function
   * to indicate a critical error, as attempting to add an existing link should not occur. If no such links
   * exist, it establishes a new link by setting the appropriate flags in the origin data for both origins
   * and then updates the state with the modified origin data.
   *
   * Note: The `unreacheable` function is assumed to be a mechanism for handling errors that are not expected
   * to occur, indicating a severe logic flaw if triggered.
   *
   * @param {TOrigin} from - The origin initiating the link.
   * @param {TOrigin} to - The target origin of the link.
   * @returns {Promise<void>} A promise that resolves once the link has been successfully established.
   * @throws Triggers an error if an attempt is made to add a link that already exists, indicating a logic error.
   */
  public async link(from: TOrigin, to: TOrigin): Promise<void> {
    const fromOriginData = await this.getOriginData(from);
    const toOriginData = await this.getOriginData(to);

    if (fromOriginData.linksTo[to]) {
      unreacheable(`Unable to add an existing TO link: ${from} -> ${to}`);
    }
    if (toOriginData.linksFrom[from]) {
      unreacheable(`Unable to add an existing FROM link: ${from} -> ${to}`);
    }

    fromOriginData.linksTo[to] = true;
    toOriginData.linksFrom[from] = true;

    this.setOriginData(from, fromOriginData);
    this.setOriginData(to, toOriginData);
  }

  /**
   * Removes a bidirectional link between two origins in the state.
   * This asynchronous method retrieves the origin data for both the 'from' and 'to' origins. It then checks
   * if the link from the 'from' origin to the 'to' origin and the link from the 'to' origin to the 'from' origin
   * actually exist. If either link does not exist, it invokes an `unreacheable` function to signal a critical
   * error, as attempting to delete a non-existing link indicates a logic flaw. If both links exist, it proceeds
   * to remove them by deleting the respective entries in the origin data and then updates the state with the
   * modified origin data to reflect the unlinking.
   *
   * Note: The `unreacheable` function is used to handle situations that are logically not supposed to occur,
   * indicating a severe logic error if triggered.
   *
   * @param {TOrigin} from - The origin from which the link is initiated.
   * @param {TOrigin} to - The target origin of the link to be removed.
   * @returns {Promise<void>} A promise that resolves once the link has been successfully removed.
   * @throws Triggers an error if an attempt is made to delete a link that does not exist, indicating a logic error.
   */
  public async unlink(from: TOrigin, to: TOrigin): Promise<void> {
    const fromOriginData = await this.getOriginData(from);
    const toOriginData = await this.getOriginData(to);

    if (!fromOriginData.linksTo[to]) {
      unreacheable(`Unable to delete a non-existing TO link: ${from} -> ${to}`);
    }
    if (!toOriginData.linksFrom[from]) {
      unreacheable(`Unable to delete a non-existing FROM link: ${from} -> ${to}`);
    }

    delete fromOriginData.linksTo[to];
    delete toOriginData.linksFrom[from];

    this.setOriginData(from, fromOriginData);
    this.setOriginData(to, toOriginData);
  }

  /**
   * Removes all outgoing links from a specified origin, effectively unlinking it from all connected origins.
   * This asynchronous method first retrieves the origin data for the 'from' origin. It then iterates over
   * all origins that the 'from' origin has links to, retrieves the origin data for each linked origin ('to' origin),
   * and deletes the corresponding link back to the 'from' origin. After removing all such links, it resets the
   * 'linksTo' object of the 'from' origin data, effectively removing all outgoing links. The state is updated
   * to reflect these changes for both the 'from' origin and all affected 'to' origins.
   *
   * This method also returns a list of all origins that were linked from the 'from' origin, providing a record
   * of the connections that were removed.
   *
   * @param {TOrigin} from - The origin from which to remove all outgoing links.
   * @returns {Promise<TOrigin[]>} A promise that resolves to an array of origins that were previously linked from the 'from' origin.
   */
  public async unlinkAll(from: TOrigin): Promise<TOrigin[]> {
    const fromOriginData = await this.getOriginData(from);
    const oldLinks = Object.keys(fromOriginData.linksTo);

    for (let to of oldLinks) {
      const toOriginData = await this.getOriginData(to);
      delete toOriginData.linksFrom[from];

      this.setOriginData(to, toOriginData);
    }

    fromOriginData.linksTo = {};
    this.setOriginData(from, fromOriginData);

    return oldLinks;
  }

  /**
   * Adds a new identity (mask) to the specified origin within the state and returns the created mask.
   * If the origin data does not exist for the specified origin, it first creates default origin data
   * with an initial mask. Then, it calculates a new identity ID based on the number of existing identities
   * (masks) for that origin. It generates a new mask using this identity ID and the origin, and adds this
   * new mask to the origin data. The state is updated to include this new mask under the specified origin.
   * This method facilitates dynamic identity creation within origins, allowing for the expansion of identities
   * associated with each origin.
   *
   * @param {TOrigin} origin - The origin for which to add a new identity (mask).
   * @returns {Promise<IMask>} A promise that resolves to the newly created mask for the added identity.
   */
  public async addIdentity(origin: TOrigin): Promise<IMask> {
    let originData = this.state.originData[origin];

    if (originData === undefined) {
      const mask = await this.makeMask(origin, 0);
      originData = makeDefaultOriginData(mask);
    }

    const identityId = Object.keys(originData.masks).length;
    const mask = await this.makeMask(origin, identityId);
    originData.masks[identityId] = mask;

    this.state.originData[origin] = originData;

    return mask;
  }

  /**
   * Adds an asset to the state, or returns the existing asset data if it already exists.
   * This method checks if asset data for a given asset ID already exists in the state.
   * If it does, it immediately returns the existing asset data. If not, it creates default
   * asset data using the `makeDefaultAssetData` function, adds this new asset data to the
   * state under the specified asset ID, and then returns the newly created asset data.
   * This ensures that each asset is uniquely represented in the state and facilitates easy
   * retrieval and management of asset data.
   *
   * @param {string} assetId - The ID of the asset to add or retrieve.
   * @returns {IAssetData} The asset data associated with the given asset ID.
   */
  public addAsset(assetId: string): IAssetData {
    let assetData = this.state.assetData[assetId];

    if (assetData !== undefined) return assetData;

    assetData = makeDefaultAssetData();

    this.state.assetData[assetId] = assetData;

    return assetData;
  }

  /**
   * Adds a new account to the specified asset in the state and returns the name of the created account.
   * If the asset data does not already exist for the specified asset ID, it throws an error indicating
   * that no such asset exists. Otherwise, it generates a new account ID based on the number of existing
   * accounts for that asset. It then creates a new account with a name following the pattern "Account #X",
   * where X is the new account ID, and adds this account to the asset's data. The state is updated to
   * reflect this new account under the specified asset.
   *
   * Note: The `unreacheable` function is assumed to be a method for handling unexpected or logically
   * impossible conditions, indicating a severe logic error if triggered.
   *
   * @param {string} assetId - The ID of the asset for which to add a new account.
   * @returns {string} The name of the newly created account for the asset.
   * @throws Throws an error if no asset data exists for the specified asset ID, indicating a logic error.
   */
  public addAssetAccount(assetId: string): string {
    const assetData = this.state.assetData[assetId];

    if (assetData === undefined) unreacheable(`No asset exists ${assetId}`);

    const accountId = Object.keys(assetData.accounts).length;
    const name = `Account #${accountId}`;
    assetData.accounts[accountId] = name;

    return name;
  }

  /**
   * Edits the name of an existing account for a specified asset within the state.
   * This method first checks if asset data exists for the given asset ID. If not, it triggers an error
   * indicating that no such asset exists. It then checks if an account with the specified account ID exists
   * within the asset's data. If the account does not exist, it triggers another error indicating the absence
   * of the account. If both the asset and the account exist, it updates the name of the account to the new
   * name provided. This allows for the dynamic renaming of accounts associated with assets in the state.
   *
   * Note: The `unreacheable` function is used to handle conditions that are expected to never occur,
   * serving as a mechanism for flagging severe logic errors when they are triggered.
   *
   * @param {string} assetId - The ID of the asset whose account is to be edited.
   * @param {TAccountId} accountId - The ID of the account within the asset to edit.
   * @param {string} newName - The new name to assign to the account.
   * @throws Throws an error if no asset data exists for the specified asset ID or if no account exists with the specified account ID.
   */
  public editAssetAccount(assetId: string, accountId: TAccountId, newName: string) {
    const assetData = this.state.assetData[assetId];

    if (assetData === undefined) unreacheable(`No asset exists ${assetId}`);
    if (Object.keys(assetData.accounts).length <= accountId) unreacheable(`No account exists ${assetId} ${accountId}`);

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
    const state = await retrieveStateWrapped();

    return new StateManager(state);
  }

  public static async persist(): Promise<void> {
    return persistStateLocal();
  }

  public incrementStats(data: Partial<IStatisticsData>): void {
    if (data.login) this.state.statistics.data.login += data.login;
    if (data.transfer) this.state.statistics.data.transfer += data.transfer;
    if (data.origin_link) this.state.statistics.data.origin_link += data.origin_link;
    if (data.origin_unlink) this.state.statistics.data.origin_unlink += data.origin_unlink;
  }

  public getStats(): IStatistics {
    return this.state.statistics;
  }

  public resetStats(): void {
    this.state.statistics = makeDefaultStatistics();
  }
}


/**
 * Creates the default state object.
 * @returns The default state object.
 */
function makeDefaultState(): IState {
  return {
    version: 1,
    originData: {},
    assetData: {},
    statistics: makeDefaultStatistics(),
  };
}

/**
 * Creates a default statistics object.
 * @returns The default statistics object.
 */
function makeDefaultStatistics(): IStatistics {
  return {
    lastResetTimestamp: Date.now(),
    data: {
      login: 0,
      transfer: 0,
      origin_link: 0,
      origin_unlink: 0,
    },
  };
}


/**
 * Creates the default origin data object.
 * 
 * @param mask - The mask object.
 * @returns The default origin data object.
 */
function makeDefaultOriginData(mask: IMask): IOriginData {
  return {
    masks: { 0: mask },
    currentSession: undefined,
    linksFrom: {},
    linksTo: {},
  };
}

/**
 * Creates the default asset data.
 * @returns The default asset data.
 */
function makeDefaultAssetData(): IAssetData {
  return {
    accounts: { 0: "Main" },
  };
}

let STATE: IState | null = null;
let LAST_STATE_PERSIST_TIMESTAMP = 0;
let STATE_UPDATE_TIMESTAMP = 0;

/**
 * Retrieves the current state from persistent storage or initializes it with a default state if not present.
 * This function first checks if the global state (`STATE`) is null, indicating that it has not been initialized.
 * If so, it attempts to retrieve the state using the `snap.request` method with a "get" operation. If the state
 * is not found in persistent storage (i.e., returned state is null), it initializes the global state with a default
 * state using `makeDefaultState`. If a state is found, it is parsed and validated using `zodParse` after decoding
 * it from CBOR format to ensure it conforms to the expected state schema (`ZState`). The retrieved or initialized
 * state is then wrapped in a proxy that monitors for any changes to the state or its nested properties, updating a
 * global timestamp (`STATE_UPDATE_TIMESTAMP`) to track the latest update. This mechanism facilitates state persistence
 * and synchronization by allowing for efficient state retrieval and automatic tracking of modifications for subsequent
 * persistence operations.
 *
 * @returns {Promise<IState>} A promise that resolves to the global state object, wrapped in a change-detection proxy.
 */
async function retrieveStateWrapped(): Promise<IState> {
  if (STATE === null) {
    const state = await snap.request({
      method: "snap_manageState",
      params: {
        operation: "get",
      },
    });

    if (state == null) {
      const s = makeDefaultState();
      STATE = s;

      STATE_UPDATE_TIMESTAMP = Date.now();
    } else {
      STATE = zodParse(ZState, fromCBOR(state.data as string));
    }
  }

  return createDeepOnChangeProxy(STATE, () => {
    STATE_UPDATE_TIMESTAMP = Date.now();
  }) as IState;
}

let proxyCache = new WeakMap();

/**
 * Creates a proxy for an object that recursively applies itself to all nested objects, enabling deep change detection.
 * Whenever a set operation occurs on any level of the object or its nested objects, a provided callback function is invoked.
 * This is achieved using JavaScript's Proxy object to intercept get and set operations. The function maintains a cache of
 * already proxied objects to prevent creating multiple proxies for the same object, which could lead to performance issues
 * and infinite recursion. This method is particularly useful for implementing reactive state management or deep observation
 * patterns where changes to any part of an object or its sub-objects need to trigger a global or specific action.
 *
 * @param {any} target - The target object to wrap with the proxy.
 * @param {() => void} onChange - A callback function to be invoked whenever a set operation occurs.
 * @returns {unknown} A proxy wrapped version of the target object that deeply monitors changes.
 */
function createDeepOnChangeProxy(target: any, onChange: () => void): unknown {
  return new Proxy(target, {
    get(target, property) {
      const item = target[property];
      if (item && typeof item === "object") {
        if (proxyCache.has(item)) return proxyCache.get(item);
        const proxy = createDeepOnChangeProxy(item, onChange);
        proxyCache.set(item, proxy);
        return proxy;
      }
      return item;
    },
    set(target, property, newValue) {
      target[property] = newValue;
      onChange();
      return true;
    },
  });
}

/**
 * Asynchronously persists the current state to local storage using the MetaMask Snaps `snap_manageState` method.
 * This function first checks if the state has been updated since the last persistence by comparing timestamps.
 * If the state is up-to-date (meaning no updates have occurred since the last persistence), the function returns early.
 * Otherwise, it validates the current state against a Zod schema (`ZState`) to ensure it meets the expected structure.
 * After validation, it updates the timestamp to the current time, indicating the state is being persisted.
 * Finally, it serializes the state using CBOR (Concise Binary Object Representation) for efficient storage and
 * uses the `snap.request` method to request the MetaMask Snaps environment to persist the new state.
 *
 * This method ensures that only valid and recently modified states are persisted, minimizing unnecessary operations
 * and ensuring data integrity through schema validation.
 *
 * @returns {Promise<void>} A promise that resolves once the state has been successfully persisted.
 */
async function persistStateLocal(): Promise<void> {
  if (LAST_STATE_PERSIST_TIMESTAMP >= STATE_UPDATE_TIMESTAMP) return;

  zodParse(ZState, STATE);

  LAST_STATE_PERSIST_TIMESTAMP = Date.now();

  await snap.request({
    method: "snap_manageState",
    params: {
      operation: "update",
      newState: { data: toCBOR(STATE) },
    },
  });
}
