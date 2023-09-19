import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
    publicDir: 'src/site_frontend/assets',
    plugins: [solid()],
})
