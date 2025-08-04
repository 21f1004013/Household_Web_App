import store from "../utils/store.js";

export default {
  data() {
    return {
      searchCategory: "service_requests",
      searchQuery: "",
      services: [],
      serviceRequests: [],
      customers: [],
      serviceProfessionals: [],
      filteredData: [], // Holds filtered results
    };
  },
  methods: {
    async fetchData(endpoint, key) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
          }
        });
        if (!response.ok) throw new Error(`Failed to fetch ${key}`);
        this[key] = await response.json();
        this.filteredData = this[key]; // Initialize filtered data
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
      }
    },
    fetchAllData() {
      this.fetchData('/api/service_requests', 'serviceRequests');
      this.fetchData('/api/customers', 'customers');
      this.fetchData('/api/lala', 'serviceProfessionals');
    },
    searchResults() {
      let dataset = [];

      if (this.searchCategory === "service_requests") {
        dataset = this.serviceRequests;
      } else if (this.searchCategory === "customers") {
        dataset = this.customers;
      } else if (this.searchCategory === "professionals") {
        dataset = this.serviceProfessionals;
      }

      if (this.searchQuery) {
        this.filteredData = dataset.filter(item =>
          JSON.stringify(item).toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      } else {
        this.filteredData = dataset;
      }
    },
  },
  watch: {
    searchCategory() {
      this.searchResults(); // Auto-filter when category changes
    },
    searchQuery() {
      this.searchResults(); // Auto-filter when query changes
    }
  },
  mounted() {
    this.fetchAllData();
  },
  template: `
  <div class="container">
    <h2 class="my-4">Admin Dashboard</h2>

    <!-- Search Functionality -->
    <div class="mt-3 p-3 border rounded">
      <h5>Search</h5>
      <div class="d-flex">
        <select v-model="searchCategory" class="form-select w-25 me-2">
          <option value="service_requests">Service Requests</option>
          <option value="customers">Customers</option>
          <option value="professionals">Professionals</option>
        </select>
        <input type="text" v-model="searchQuery" class="form-control w-50 me-2" placeholder="Search">
      </div>
    </div>

    <!-- Filtered Results -->
    <h3 v-if="searchCategory === 'service_requests'">Service Requests</h3>
    <ul v-if="searchCategory === 'service_requests'" class="list-group">
      <li v-for="request in filteredData" :key="request.id" class="list-group-item d-flex justify-content-between align-items-center">
        <span>Requester:{{ request.requester_name }} || Name: {{ request.service_name }} || Professional: {{ request.professional_name }}</span>
      </li>
    </ul>

    <h3 v-if="searchCategory === 'customers'">Customers</h3>
    <ul v-if="searchCategory === 'customers'" class="list-group">
      <li v-for="cust in filteredData" :key="cust.id" class="list-group-item d-flex justify-content-between align-items-center">
        <span>{{ cust.id }} - {{ cust.username }} - {{ cust.email }} - {{ cust.active }}</span>
      </li>
    </ul>

    <h3 v-if="searchCategory === 'professionals'">Professionals</h3>
    <ul v-if="searchCategory === 'professionals'" class="list-group">
      <li v-for="prof in filteredData" :key="prof.id" class="list-group-item d-flex justify-content-between align-items-center">
        <span>{{ prof.id }} - {{ prof.name }} - {{ prof.type }} - {{ prof.is_approved }} - ({{ prof.experience }} years)</span>
      </li>
    </ul>
  </div>
  `
};
