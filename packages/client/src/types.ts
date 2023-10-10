export interface IMetaMaskEthereumProvider {
  isMetaMask?: boolean;
  request: <R>(req: { method: string; params?: unknown }) => Promise<R>;
}
