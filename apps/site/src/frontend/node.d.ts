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
