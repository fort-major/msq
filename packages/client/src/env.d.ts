declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      MSQ_SNAP_SITE_ORIGIN: string;
      MSQ_SNAP_ID: string;
      MSQ_SNAP_VERSION: string;
    }
  }
}

export {};
