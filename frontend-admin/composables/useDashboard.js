import dashboardService from "~/services/dashboard.service";

export const useDashboard = () => {

  const summary = ref({});
  const loading = ref(false);
  const error = ref(null);

  const fetchSummary = async () => {

    loading.value = true;
    error.value = null;

    try {

      const response = await dashboardService.getDashboardSummary();

      // If service returns only data
      summary.value = response || {};

      // If service returns { success, message, data }
      // then use:
      // summary.value = response.data || {};

    } catch (err) {

      console.error(err);
      error.value = err.message;

    } finally {

      loading.value = false;

    }

  };

  return {
    summary,
    loading,
    error,
    fetchSummary
  };

};