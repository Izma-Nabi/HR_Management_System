<script setup lang="ts">
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");
const config = useRuntimeConfig();
const loginAdmin = async () => {
    try {
        loading.value = true;
        errorMessage.value = "";
        const response:any = await $fetch(
            `${config.public.apiBase}/api/auth/login`,
            {
                method:"POST",
                body:{
                    email:email.value,
                    password:password.value
                }
            }
        );
        console.log(response);
        localStorage.setItem(
            "token",
            response.data.token
        );
        localStorage.setItem(
            "user",
            JSON.stringify(response.data.user)
        );
        alert("Login successful");
    }
    catch(error:any){
        console.log(error);
        errorMessage.value =
            error?.data?.message ||
            "Something went wrong";
    }
    finally{
        loading.value = false;
    }
};
</script>