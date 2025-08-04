import store from "../utils/store.js";

export default {
  data() {
    return {
      serviceRequests: [],
      professionalId: null,
    };
  },

  async mounted() {
    this.professionalId = store.getters.getLoginData.id;
    this.fetchRequests();
  },

  methods: {
    async fetchRequests() {
      try {
        const response = await fetch("/api/service_requests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch requests");
        this.serviceRequests = await response.json();
      } catch (error) {
        console.error("Error fetching service requests:", error);
      }
    },

    async updateRequest(id, action) {
      try {
        const response = await fetch(`/api/service_requests/${id}/${action}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": store.getters.getLoginData.token,
          },
        });

        if (!response.ok) throw new Error(`Failed to ${action} request`);

        // ✅ Update status dynamically
        this.serviceRequests = this.serviceRequests.map(req =>
          req.id === id
            ? { ...req, service_status: action === "accept" ? "Accepted" : action === "reject" ? "Rejected" : "Completed" }
            : req
        );
      } catch (error) {
        console.error(`Error ${action}ing request:`, error);
      }
    },
  },

  template: `
    <div class="container">
      <h2 class="my-4">Service Professional Dashboard</h2>

      <h3>Service Requests</h3>
      <ul class="list-group">
        <li v-for="request in serviceRequests" :key="request.id" class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>Customer:</strong> {{ request.requester_name }} <br>
            <strong>Service:</strong> {{ request.service_id }} <br>
            <strong>Status:</strong> <span :class="statusClass(request.service_status)">{{ request.service_status }}</span>
          </div>

          <div>
            <button v-if="request.service_status === 'requested'" @click="updateRequest(request.id, 'accept')" class="btn btn-success btn-sm me-2">Accept</button>
            <button v-if="request.service_status === 'requested'" @click="updateRequest(request.id, 'reject')" class="btn btn-danger btn-sm">Reject</button>
            <button v-if="request.service_status === 'Accepted'" @click="updateRequest(request.id, 'close')" class="btn btn-warning btn-sm">Close</button>
          </div>
        </li>
      </ul>
    </div>
  `,

  computed: {
    statusClass() {
      return (status) => {
        switch (status) {
          case "requested": return "text-primary";
          case "Accepted": return "text-success";
          case "Rejected": return "text-danger";
          case "Completed": return "text-muted";
          default: return "text-dark";
        }
      };
    }
  }
};
