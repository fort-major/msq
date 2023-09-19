type Overwrite<T1, T2> = {
    [P in Exclude<keyof T1, keyof T2>]: T1[P]
} & T2;

export interface IMetaMaskEthereumProvider {
    isMetaMask?: boolean;
    request<R>(req: any): R;
    once(eventName: string | symbol, listener: (...args: any[]) => void): this;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    off(eventName: string | symbol, listener: (...args: any[]) => void): this;
    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
}