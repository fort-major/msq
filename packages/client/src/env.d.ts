declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            TURBO_SNAP_SITE_ORIGIN: string;
            TURBO_SNAP_ID: string;
            TURBO_SNAP_VERSION: string;
        }
    }
}

export { }