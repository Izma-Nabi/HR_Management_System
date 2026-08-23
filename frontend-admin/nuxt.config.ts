export default defineNuxtConfig({
  css: ["~/assets/css/dashboard.css"],
  devtools:{
    enabled:true
  },
  runtimeConfig:{
    public:{
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:5005/api"
    }
  }
})
