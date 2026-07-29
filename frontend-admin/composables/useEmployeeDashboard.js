export const useEmployeeDashboard = () => {

  const dashboard = ref({});

  const loading = ref(false);

  const error = ref("");

  const config = useRuntimeConfig();



  const fetchEmployeeDashboard = async (
    options = {}
  ) => {

    try {

      if (!options.silent) {
        loading.value = true;
      }


      const token =
        localStorage.getItem("token");


      if (!token) {
        throw new Error("Token not found");
      }



      const response = await $fetch(
        `${config.public.apiBase}/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      console.log(
        "EMPLOYEE DASHBOARD RESPONSE:",
        response
      );


      dashboard.value =
        response.data;



    } catch (err) {

      console.error(
        "Employee dashboard error:",
        err
      );


      error.value =
        err?.data?.message ||
        err?.message ||
        "Failed loading dashboard";


    } finally {

      loading.value = false;

    }

  };



  return {

    dashboard,

    loading,

    error,

    fetchEmployeeDashboard

  };

};