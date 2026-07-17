import dashboardService from "~/services/dashboard.service";

export const useDashboard = () => {

  const dashboard = ref({
    sections: {}
  });
  const loading = ref(false);
  const error = ref(null);

  const sections = computed(() => dashboard.value?.sections || {});

  const fetchDashboard = async () => {

    loading.value = true;
    error.value = null;

    try {

      dashboard.value = await dashboardService.getDashboard();

    } catch (err) {

      console.error(err);
      error.value = err.message;

    } finally {

      loading.value = false;

    }

  };

  return {
    dashboard,
    sections,
    loading,
    error,
    fetchDashboard
  };

};
