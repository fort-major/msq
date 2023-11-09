interface ImportMeta {
  env: {
    DEV: boolean;
    VITE_MSQ_SNAP_VERSION: string;
    VITE_MSQ_SNAP_ID: string;
    VITE_MSQ_SNAP_SITE_ORIGIN: string;
    VITE_MSQ_DFX_NETWORK_HOST: string;
    VITE_CANISTER_ID_MSQ_STATISTICS: string;
    VITE_MSQ_MODE: "DEV" | "PROD";
  };
}

declare module "*.svg" {
  const content: string;
  export default content;
}

enum QRCodeCorrectLevel {
  L = 1,
  M = 0,
  Q = 3,
  H = 2,
}

interface IQRCodeOpts {
  width?: number;
  height?: number;
  colorDark?: string;
  colorLight?: string;
  correctLevel?: QRCodeCorrectLevel;
}

declare class QRCode {
  constructor(el: HTMLElement, opt: string | IQRCodeOpts);
  clear(): void;
  makeCode(input: string): void;
}
