export default defineNuxtConfig({
  devtools:{
    enabled:true
  },
  runtimeConfig:{
    public:{
      apiBase:"http://localhost:5000/api"
    }
  }
})
