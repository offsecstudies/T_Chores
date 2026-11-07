import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['icon.svg'],manifest:{name:'Teddy Chores',short_name:'Teddy Chores',description:'Small habits, big adventures.',theme_color:'#236e58',background_color:'#f7f8f4',display:'standalone',start_url:'/',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]}})]});
