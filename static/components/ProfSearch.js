import store from "../utils/store.js";

export default {
  data() {
    return {
      searchQuery: "",
      selected_service_status: "", 
      services: [],
      filteredServices: [],
      serviceTypes: [], 
      professionals: {},
      selectedProfessionals: {}
    };
  },
  methods: {
    async fetchServices() {
      try {
        const response = await fetch("/api/service_requests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch services");
        this.services = await response.json();
        this.extractServiceTypes();
        this.filterServices();
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    },
    extractServiceTypes() {
      const types = new Set(this.services.map(service => service.service_status));
      this.serviceTypes = [...types];
    },
    filterServices() {
      this.filteredServices = this.services.filter(service => {
        return (
          (!this.searchQuery || service.requester_name.toLowerCase().includes(this.searchQuery.toLowerCase())) &&
          (!this.selected_service_status || service.service_status === this.selected_service_status)
        );
      });
    },
  },
  watch: {
    searchQuery() { this.filterServices(); },
    selected_service_status() { this.filterServices(); }
  },
  mounted() {
    this.fetchServices();
  },
  template: `
  <div>
    <div class="container">
      <h2 class="my-4">Customer Dashboard</h2>
      
      <!-- Search & Filter Bar -->
      <div class="mt-3 p-3 border rounded">
        <h5>Search for Customer</h5>
        <input type="text" v-model="searchQuery" class="form-control w-50" placeholder="Search Customer">
        
        <h5 class="mt-3">Filter by Service Type</h5>
        <select v-model="selected_service_status" class="form-select w-50">
          <option value="">All</option>
          <option v-for="type in serviceTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
      
      <ul class="list-group mt-3" style="max-height: 300px; overflow-y: auto;">
        <li v-for="service in filteredServices" :key="service.id" class="list-group-item d-flex justify-content-between align-items-center">
          <span>
            <strong>{{ service.requester_name }}</strong> - {{ service.service_name }} | {{ service.remarks }} | {{ service.date_of_request }}
          </span>
          <span 
            class="badge"
            :class="{
              'bg-success': service.service_status === 'Completed',
              'bg-danger': service.service_status === 'Rejected',
              'bg-warning': service.service_status === 'requested',
              'bg-info': service.service_status === 'Accepted'
            }"
          >
            {{ service.service_status }}
          </span>
        </li>
      </ul>
    </div>
  </div>
  `
};