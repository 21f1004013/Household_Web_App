import store from "../utils/store.js";

export default {
  data() {
    return {
      searchQuery: "",
      services: [],
      filteredServices: [],
      serviceRequests: [],
      completedRequests: [], // Stores completed requests
      editingRequest: null,
      editedRequest: { remarks: ""},
      professionals: {},
      selectedProfessionals: {},
      showRemarksModal: false,
      rating: "",
      remarks: "",
      selectedRequestId: null, // Stores the request being rated
    };
  },
  methods: {
    async fetchStats() {
      try {
        const response = await fetch("/api/admin/stats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch services");
        console.log(response.json())
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    }
  },

  mounted() {
    this.fetchStats();
  },
  template: `
  <div>
    <div class="container">
      <h2 class="my-4">Admin Graphs</h2>
       
       <!-- Service Images (Displayed Horizontally) -->
      <div class="d-flex overflow-auto mb-3">
        <img src="static/graphs/pending_vs_completed_requests.png" alt="Service 1" class="img-thumbnail me-2" style="width: 520px; height: 520px; ">
        <img src="static/graphs/num_customers_professionals.png" alt="Service 2" class="img-thumbnail me-2" style="width: 520px; height: 520px; ">
        <img src="static/graphs/service_professionals.png" alt="Service 3" class="img-thumbnail me-2" style="width: 520px; height: 520px; ">
        <img src="static/graphs/customers_vs_professionals.png" alt="Service 4" class="img-thumbnail me-2" style="width: 520px; height: 520px; ">
      </div>
    </div>
  </div>
  `
};