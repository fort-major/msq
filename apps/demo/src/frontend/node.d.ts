interface ImportMeta {
  env: {
    DEV: boolean;
    VITE_MSQ_MODE: "DEV" | "PROD";
    VITE_CANISTER_ID_DEMO_BACKEND: string;
    VITE_MSQ_SNAP_VERSION: string;
    VITE_MSQ_SNAP_ID: string;
    VITE_MSQ_SNAP_SITE_ORIGIN: string;
    VITE_MSQ_DFX_NETWORK_HOST: string;
  };
}

declare module "*.svg" {
  const content: string;
  export default content;
}
