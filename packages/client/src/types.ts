export interface IMetaMaskEthereumProvider {
  isMetaMask?: boolean;
  request: <R>(req: { method: string; params?: unknown }) => Promise<R>;
}

export type IGetSnapsResponse = Record<
  string,
  | {
      version: string;
      id: string;
      enabled: boolean;
      blocked: boolean;
    }
  | undefined
>;
