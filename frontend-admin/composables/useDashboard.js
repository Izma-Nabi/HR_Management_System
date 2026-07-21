import dashboardService from "~/services/dashboard.service";

export const useDashboard = () => {

  const dashboard = ref({
    sections: {}
  });
  const loading = ref(false);
  const error = ref(null);

  const sections = computed(() => dashboard.value?.sections || {});

  const fetchDashboard = async ({ silent = false } = {}) => {

    if (!silent) {
      loading.value = true;
    }

    error.value = null;

    try {

      dashboard.value = await dashboardService.getDashboard();

    } catch (err) {

      console.error(err);
      error.value = err.message;

    } finally {

      if (!silent) {
        loading.value = false;
      }

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
