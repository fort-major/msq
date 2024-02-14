export interface IMetaMaskEthereumProvider {
  isMetaMask?: boolean;
  request: <R>(req: { method: string; params?: unknown }) => Promise<R>;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
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
