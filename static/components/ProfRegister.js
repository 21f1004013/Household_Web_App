import store from "../utils/store.js";


export default {
    data() {
      return {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        service_type: "",
        description: "",
        experience: "",
        errorMessage: "",
        successMessage: "",
      };
    },
    methods: {
      async registerProfessional() {
        if (this.password !== this.confirmPassword) {
          this.errorMessage = "Passwords do not match!";
          return;
        }
  
        try {
          const response = await fetch("/api/prof_register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: this.username,
              email: this.email,
              password: this.password,
              service_type: this.service_type,
              description: this.description,
              experience: parseInt(this.experience) || 0,
            }),
          });
  
          const responseData = await response.json();
  
          if (response.ok) {
            this.successMessage = responseData.message;
            this.errorMessage = "";
            setTimeout(() => {
              this.$router.push("/main_login"); // Redirect to login after successful registration
            }, 2000);
          } else {
            this.errorMessage = responseData.error;
          }
        } catch (error) {
          this.errorMessage = "Something went wrong. Please try again!";
        }
      },
    },
    template: `
      <div class="register-container">
        <div class="card p-4 shadow-sm">
          <h3 class="text-center">Service Professional Registration</h3>
          <form @submit.prevent="registerProfessional">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input v-model="username" type="text" id="username" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input v-model="email" type="email" id="email" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input v-model="password" type="password" id="password" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <input v-model="confirmPassword" type="password" id="confirmPassword" class="form-control" required />
            </div>
            <div class="mb-3">
            <label for="service_type" class="form-label">Service Type</label>
            <select v-model="service_type" id="service_type" class="form-control" required>
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
              <label for="description" class="form-label">Description</label>
              <textarea v-model="description" id="description" class="form-control" required></textarea>
            </div>
            <div class="mb-3">
              <label for="experience" class="form-label">Experience (Years)</label>
              <input v-model="experience" type="number" id="experience" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Register</button>
            <p v-if="successMessage" class="text-success mt-2 text-center">{{ successMessage }}</p>
            <p v-if="errorMessage" class="text-danger mt-2 text-center">{{ errorMessage }}</p>
          </form>
        </div>
      </div>
    `,
  };
  