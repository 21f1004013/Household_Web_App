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
    async fetchServices() {
      try {
        const response = await fetch("/api/services", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch services");
        this.services = await response.json();
        this.filteredServices = this.services;
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    },
    async fetchServiceRequests() {
      try {
        const response = await fetch("/api/service_requests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch service requests");

        const requests = await response.json();
        this.serviceRequests = requests.filter(req => req.service_status !== "completed");
        this.completedRequests = requests.filter(req => req.service_status === "completed"); // Fetch completed requests
      } catch (error) {
        console.error("Error fetching service requests:", error);
      }
    },
    async submitRemarks() {
      if (!this.selectedRequestId || !this.rating) {
        alert("Please provide a rating before submitting!");
        return;
      }

      try {
        const response = await fetch(`/api/service_requests/${this.selectedRequestId}/rate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role,
          },
          body: JSON.stringify({
            rating: this.rating.length, // Convert stars to numeric value
            remarks: this.remarks,
          }),
        });

        if (!response.ok) throw new Error("Failed to submit rating");

        alert("Rating submitted successfully!");
        this.showRemarksModal = false;
        this.fetchServiceRequests(); // Refresh the completed list
      } catch (error) {
        console.error("Error submitting rating:", error);
        alert("Failed to submit rating. Please try again.");
      }
    },
    openRemarksModal(requestId) {
      this.selectedRequestId = requestId;
      this.showRemarksModal = true;
    },
  },
  watch: {
    searchQuery() {
      this.filteredServices = this.services.filter(service =>
        Object.values(service).some(value =>
          String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      );
    },
  },
  mounted() {
    this.fetchServices();
    this.fetchServiceRequests();
  },
  template: `
  <div>
    <div class="container">
      <h2 class="my-4">Customer Dashboard</h2>

      <!-- Search Bar -->
      <div class="mt-3 p-3 border rounded">
        <h5>Search for Services</h5>
        <input type="text" v-model="searchQuery" class="form-control w-50" placeholder="Search services">
      </div>

      <ul class="list-group">
        <li v-for="service in filteredServices" :key="service.id" class="list-group-item d-flex justify-content-between align-items-center">
          <span>
            <strong>{{ service.name }}</strong> - ₹{{ service.price }} | {{ service.service_type }} | {{ service.time_required }} day
          </span>

          <!-- Select Professional -->
          <select v-model="selectedProfessionals[service.id]" class="form-select me-2" @focus="fetchProfessionals">
            <option disabled selected>Select a Professional</option>
            <option v-for="prof in professionals" :key="prof.id" :value="prof.user_id">
              {{ prof.name }} | {{ prof.type }} | ({{ prof.experience }} years)
            </option>
          </select>

          <!-- Book Service Button -->
          <button @click="bookService(service.id)" class="btn btn-primary btn-sm">Book Service</button>
        </li>
      </ul>
    </div>

    <!-- My Service Requests -->
    <div class="container">
      <h2 class="my-4">My Service Requests</h2>
      <ul class="list-group">
        <li v-for="request in serviceRequests" :key="request.id" class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>Service ID:</strong> {{ request.service_id }} <br>
            <strong>Status:</strong> {{ request.service_status }} <br>
            <strong>Remarks:</strong> {{ request.remarks }} <br>
            <strong>Date of Request:</strong> {{ request.date_of_request }} 
          </div>

          <div>
            <button @click="closeServiceRequest(request.id)" class="btn btn-danger btn-sm">Close</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Completed Service Requests with Rating -->
    <div class="container">
      <h2 class="my-4">Completed Service Requests</h2>
      <ul class="list-group">
        <li v-for="request in completedRequests" :key="request.id" class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>Service ID:</strong> {{ request.service_id }} <br>
            <strong>Professional:</strong> {{ request.professional_name }} <br>
            <strong>Status:</strong> {{ request.service_status }} <br>
            <strong>Remarks:</strong> {{ request.remarks }} <br>
            <strong>Completed On:</strong> {{ request.completed_date }} 
          </div>

          <button @click="openRemarksModal(request.id)" class="btn btn-warning btn-sm">Rate Service</button>
        </li>
      </ul>
    </div>

    <!-- Rating & Remarks Modal -->
    <div v-if="showRemarksModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Rate Your Service</h5>
            <button type="button" class="close" @click="showRemarksModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <label>Service Rating:</label>
            <select v-model="rating" class="form-control">
              <option>⭐</option>
              <option>⭐⭐</option>
              <option>⭐⭐⭐</option>
              <option>⭐⭐⭐⭐</option>
              <option>⭐⭐⭐⭐⭐</option>
            </select>
            <label>Remarks:</label>
            <textarea v-model="remarks" class="form-control"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-success" @click="submitRemarks">Submit</button>
            <button class="btn btn-secondary" @click="showRemarksModal = false">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
};
