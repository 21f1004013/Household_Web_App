import store from "../utils/store.js";
export default {
  data() {
    return {
      newService: { name: "", description: "",service_type: "", time_required:"",price:"" },
      services: [],
      serviceRequests: [],
      customers: [],
      serviceProfessionals: [],
    };
  },
  methods: {
    async deleteRequest(id) {
      try {
        const response = await fetch(`/api/service_requests/${id}`, { 
          method: "DELETE",
          headers: { 
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
           }});
        if (!response.ok) throw new Error("Failed to delete service");
        this.serviceRequests = this.serviceRequests.filter(request => request.id !== id);
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    },
    async fetchServices() {
      try {
        const response = await axios.get('/api/services', {
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
          }
        });

        this.services = response.data;
      } catch (error) {
        console.error("Error fetching services:", error.response?.data || error.message);
      }
    },
    async fetchProfessional() {
      try {
        const response = await fetch('/api/lala', {
          method: 'GET',
          headers: {
             "Content-Type": "application/json",
             "Authentication-Token": store.getters.getLoginData.token,
             "User-Role": store.getters.getLoginData.role
           }});
        if (!response.ok) throw new Error("Failed to fetch service-professionals");
        this.serviceProfessionals = await response.json();
      } catch (error) {
        console.error("Error fetching serviceProfessionals:", error);
      }
    },
    async updateStatus(professionalId, newStatus) {
      try {
        const response = await fetch(`/api/lala/${professionalId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
          },
          body: JSON.stringify({ is_approved: newStatus })
        });
  
        if (!response.ok) throw new Error("Failed to update status");
  
        // Refresh the list after status update
        this.fetchProfessional();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    async fetchCustomer() {
      try {
        const response = await fetch('/api/customers', {
          method: 'GET',
          headers: {
             "Content-Type": "application/json",
             "Authentication-Token": store.getters.getLoginData.token,
             "User-Role": store.getters.getLoginData.role
           }});
        if (!response.ok) throw new Error("Failed to fetch customers");
        this.customers = await response.json();
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    },
    async updateActiveStatus(customerId, newStatus) {
      try {
        const response = await fetch(`/api/customers/${customerId}/active`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
          },
          body: JSON.stringify({ active: newStatus })
        });
  
        if (!response.ok) throw new Error("Failed to update status");
  
        // Refresh the list after status update
        this.fetchCustomer();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    async fetchServiceRequests() {
      try {
        const response = await fetch('/api/service_requests',{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
           }
        });
        if (!response.ok) throw new Error("Failed to fetch requests");
        this.serviceRequests = await response.json();
      } catch (error) {
        console.error("Error fetching service requests:", error);
      }
    },
    async createService() {
      try {
        console.log(this.newService);
        const response = await fetch('/api/services', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
           },
          body: JSON.stringify(this.newService)
        });
        if (!response.ok) throw new Error("Failed to create service");
        // this.newService = { name: "", description: "" };
        this.fetchServices();
      } catch (error) {
        console.error("Error creating service:", error);
      }
    },
    async updateService(service) {
      const updatedName = prompt("Enter new service name:", service.name);
      const updatedDescription = prompt("Enter new description:", service.description);
      const updatedPrice = prompt("Enter new service price:", service.price);
      
      if (!updatedName || !updatedDescription) {
        alert("Update canceled.");
        return;
      }
      try {
        const response = await fetch(`/api/services/update/${service.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
            "User-Role": store.getters.getLoginData.role
          },
          body: JSON.stringify({ name: updatedName, description: updatedDescription, price: updatedPrice})
        });
  
        if (!response.ok) throw new Error("Failed to update service");
  
        this.fetchServices(); // Refresh the list after update
      } catch (error) {
        console.error("Error updating service:", error);
      }
    },
    async downloadData() {
      const response = await fetch("/api/export",{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": store.getters.getLoginData.token,
          "User-Role": store.getters.getLoginData.role
        },
      });
      const data = await response.json();
      const taskId = data.task_id;
  
      if (!taskId) {
          console.error("Failed to get task ID");
          return;
      }
  
      // Poll the download endpoint
      const checkFile = async () => {
          const downloadResponse = await fetch(`/api/download/${taskId}`,{
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": store.getters.getLoginData.token,
              "User-Role": store.getters.getLoginData.role
            },
          });
          if (downloadResponse.status === 200) {
              // Create a hidden link to download
              const blob = await downloadResponse.blob();
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "report.csv";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          } else if (downloadResponse.status === 202) {
              setTimeout(checkFile, 3000); // Retry in 3 sec
          } else {
              console.error("Failed to generate CSV");
          }
      };
  
      checkFile();
  },
    // async downloadData() {
    //   try {
    //       const response = await fetch(`/api/export`, { 
    //           method: "GET",
    //           headers: { 
    //               "Authentication-Token": store.getters.getLoginData.token,
    //               "User-Role": store.getters.getLoginData.role
    //           }
    //       });
  
    //       if (!response.ok) throw new Error("Failed to load data");
    //       console.log(response)
    //       // const blob = await response.blob(); // Get response as Blob (CSV file)
    //       // const url = window.URL.createObjectURL(blob);
  
    //       // const link = document.createElement("a");
    //       // link.href = url;
    //       // link.download = "closed_service_requests.csv"; // Set download file name
    //       // document.body.appendChild(link);
    //       // link.click();
    //       // document.body.removeChild(link);
    //       // window.URL.revokeObjectURL(url);
    //   } catch (error) {
    //     console.error("Error downloading data:", error);
    //   }
    // },
  },
  mounted() {
    this.fetchServices();
    this.fetchServiceRequests();
    this.fetchProfessional();
    this.fetchCustomer();

  },
  template:`
    <div class="container">
    <div class="d-flex justify-content-between">
    <h1>Admin Dashboard</h1>
    <button @click="downloadData">Download Data</button>
    </div>

    <!-- Create Service -->
    <h3>Create a New Service</h3>
    <form @submit.prevent="createService" class="mb-4">
      <div class="mb-3">
      <label for="name" class="form-label">Service Name</label>
        <input v-model="newService.name" class="form-control" placeholder="Service Name" required>
      </div>
      <div class="mb-3">
      <label for="service_type" class="form-label">Service Type</label>
      <select v-model="newService.service_type" id="service_type" class="form-control" required>
        <option disabled value="">Select a Service Type</option>
        <option value="AC Repair">AC Repair</option>
        <option value="Kitchen Service">Kitchen Service</option>
        <option value="Plumbing">Plumbing</option>
        <option value="Electrical Work">Electrical Work</option>
        <option value="Saloon">Saloon</option>
        <option value="Painting">Painting</option>
        <option value="Cleaning">Cleaning</option>
      </select>
      </div>
      <div class="mb-3">
      <label for="description" class="form-label">Service Description</label>
        <input v-model="newService.description" class="form-control" placeholder="Service Description" required>
      </div>
      <div class="mb-3">
      <label for="price" class="form-label">Service price</label>
        <input v-model.capitalize="newService.price" class="form-control" placeholder="Service price" required>
      </div>
      <div class="mb-3">
      <label for="time_required" class="form-label">Time for Completion</label>
        <input v-model="newService.time_required" class="form-control" placeholder="Time required for service in day" required>
      </div>
    
      <button type="submit" class="btn btn-primary">Create</button>
    </form>

    <!-- Services List -->
    <h3>Your Services</h3>
    <ul class="list-group mb-4">
      <li v-for="service in services" :key="service.id" class="list-group-item d-flex justify-content-between align-items-center">
        <span>{{ service.name }} - {{ service.description }}</span>
        <div class="d-flex gap-2"> 
          <button @click="updateService(service)" class="btn btn-warning btn-sm">Update</button>
          <button @click="deleteService(service.id)" class="btn btn-danger btn-sm">Delete</button>
        </div>
      </li>
    </ul>

    <!-- Professional List -->
    <h3>Professional List</h3>
    <ul class="list-group mb-4">
      <li v-for="prof in serviceProfessionals" :key="prof.id" class="list-group-item d-flex justify-content-between align-items-center">
        <span>{{ prof.id }} - {{ prof.name }} - {{ prof.type }} - {{ prof.is_approved }} - ({{ prof.experience }} years)</span>
        <div class="d-flex gap-2"> 
          <button 
            @click="updateStatus(prof.id, !prof.is_approved)" 
            class="btn btn-sm" 
            :class="prof.is_approved ? 'btn-danger' : 'btn-success'"
          >
            {{ prof.is_approved ? 'Block' : 'Approve' }}
          </button>
        </div>
      </li>
    </ul>

    <!-- Customer List -->
    <h3>Customer List</h3>
    <ul class="list-group mb-4">
      <li v-for="cust in customers" :key="cust.id" class="list-group-item d-flex justify-content-between align-items-center">
        <span>{{ cust.id }} - {{ cust.username }} - {{ cust.email }} - {{ cust.active }}</span>
        <div class="d-flex gap-2"> 
          <button 
            @click="updateActiveStatus(cust.id, !cust.active)" 
            class="btn btn-sm" 
            :class="cust.active ? 'btn-danger' : 'btn-success'"
          >
            {{ cust.active ? 'Block' : 'Approve' }}
          </button>
        </div>
      </li>
    </ul>


    <!-- Customer Requests -->
    <h3>Service Requests</h3>
    <ul class="list-group">
      <li v-for="request in serviceRequests" :key="request.id" class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>Customer:</strong> {{ request.requester_name }} <br>
          <strong>Service Name:</strong> {{ request.service_name }} <br>
          <strong>Status:</strong> {{ request.service_status }} <br>
          <strong>Professional:</strong> {{ request.professional_name }} <br>
          <strong>Remarks:</strong> {{ request.remarks }} 
        </div>

        <!-- Corrected Delete Button Display -->
        <button @click="deleteRequest(request.id)" class="btn btn-warning btn-sm me-2">Delete</button>
      </li>
    </ul>
  </div> ` 
};

  
  