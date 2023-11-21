export interface IMetaMaskEthereumProvider {
  isMetaMask?: boolean;
  request: <R>(req: { method: string; params?: unknown }) => Promise<R>;
}

export interface ISnapRequest {
  snapId: string;
  request: {
    method: string;
    params: { body: string };
  };
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
