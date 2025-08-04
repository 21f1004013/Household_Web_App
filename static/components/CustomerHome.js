import store from "../utils/store.js";

export default {
  data() {
    return {
      searchQuery: "",
      services: [],
      filteredServices: [],
      serviceRequests: [],
      editingRequest: null, // Stores the request being edited
      editedRequest: { remarks: ""},
      professionals: {}, // Store professionals per service
      selectedProfessionals: {} // Store selected professional for each service
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
        this.filteredServices = this.services; // Initialize filtered data
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    },
    startEditing(request) {
        this.editingRequest = request.id;
        this.editedRequest = {
          remarks: request.remarks,

        };
      },
  
      async updateServiceRequest(requestId) {
        try {
          const response = await fetch(`/api/service_requests/${requestId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": store.getters.getLoginData.token,
              "User-Role": store.getters.getLoginData.role,
            },
            body: JSON.stringify(this.editedRequest),
          });
  
          if (!response.ok) throw new Error("Failed to update request");
  
          this.editingRequest = null; // Exit edit mode
          this.fetchServiceRequests(); // Refresh data
        } catch (error) {
          console.error("Error updating service request:", error);
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
  
          this.serviceRequests = await response.json();
        } catch (error) {
          console.error("Error fetching service requests:", error);
        }
      },
      async closeServiceRequest(requestId) {
        try {
          const response = await fetch(`/api/service_requests/${requestId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": store.getters.getLoginData.token,
              "User-Role": store.getters.getLoginData.role,
            },
            body: JSON.stringify({ service_status: "closed" }),
          });
  
          if (!response.ok) throw new Error("Failed to close request");
  
          this.fetchServiceRequests(); // Refresh the list
        } catch (error) {
          console.error("Error closing service request:", error);
        }
      },
    searchServices() {
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          this.filteredServices = this.services.filter(service =>
            Object.values(service).some(value =>
              String(value).toLowerCase().includes(query)
            )
          );
        } else {
          this.filteredServices = this.services;
        }
      },
      async fetchProfessionals() {
        try {
          const response = await fetch(`/api/lala`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": store.getters.getLoginData.token,
              "User-Role": store.getters.getLoginData.role
            }
          });
      
          if (!response.ok) throw new Error("Failed to fetch professionals");
      
          const data = await response.json();
          this.professionals = data; // Store the list of all professionals
        } catch (error) {
          console.error("Error fetching professionals:", error);
        }
      },      
      async bookService(serviceId) {
        const professionalId = this.selectedProfessionals[serviceId]; // Get selected professional
        if (!professionalId) {
          alert("Please select a service professional before booking!");
          return;
        }
      
        try {
          const response = await fetch("/api/service_requests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": store.getters.getLoginData.token,
              "User-Role": store.getters.getLoginData.role
            },
            body: JSON.stringify({ service_id: serviceId, professional_id: this.selectedProfessionals[serviceId] })
          });
      
          if (!response.ok) throw new Error("Failed to book service");
      
          const data = await response.json();
          alert(`Service booked successfully! Request ID: ${data.request_id}`);
          
          this.fetchServices(); // Refresh service list if needed
        } catch (error) {
          console.error("Error booking service:", error);
          alert("Failed to book service. Please try again.");
        }
      },
  },
  watch: {
    searchQuery() {
      this.searchServices(); // Auto-filter when query changes
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
        <li v-for="service in filteredServices" :key="service.id" class="list-group-item d-flex justify-content-between align-items-center-card">
        <span>
        <strong>{{ service.name }}</strong> - ₹{{ service.price }} | {{ service.service_type }} | {{ service.time_required }} day
        </span>

        <!-- Service Professional Dropdown -->
        <select v-model="selectedProfessionals[service.id]" class="form-select me-2"
            @focus="fetchProfessionals">
            <option disabled selected>Select a Professional</option>
            <option v-for="prof in professionals" :key="prof.id" :value="prof.user_id">
                {{ prof.user_id }} | {{ prof.name }} | {{ prof.type }} | ({{ prof.experience }} years)
            </option>
        </select>


        <!-- Book Service Button -->
        <button @click="bookService(service.id)" class="btn btn-primary btn-sm">Book Service</button>
        </li>
    </ul>
</div>
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
        
        <div v-if="editingRequest === request.id">
        <input v-model="editedRequest.remarks" type="text" class="form-control my-1" placeholder="Add remarks">
        <button @click="updateServiceRequest(request.id)" class="btn btn-success btn-sm my-1">Save</button>
        <button @click="editingRequest = null" class="btn btn-secondary btn-sm my-1">Cancel</button>
        </div>

        <div v-else>
        <button @click="startEditing(request)" class="btn btn-warning btn-sm me-2">Edit</button>
        <button @click="closeServiceRequest(request.id)" class="btn btn-danger btn-sm">Close</button>
        </div>
    </li>
    </ul>
</div>
</div>
  `
};