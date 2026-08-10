export default defineNuxtConfig({
  css: ["~/assets/css/dashboard.css"],
  devtools:{
    enabled:true
  },
  runtimeConfig:{
    public:{
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:5000/api"
    }
  }
})
