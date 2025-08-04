import store from "../utils/store.js";


export default {
    data() {
      return {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        errorMessage: "",
        successMessage: "",
      };
    },
    methods: {
      async registerUser() {
        if (this.password !== this.confirmPassword) {
          this.errorMessage = "Passwords do not match!";
          return;
        }
  
        try {
          const response = await fetch("/api/cust_register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: this.username,
              email: this.email,
              password: this.password,
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
          <h3 class="text-center">Customer Registration</h3>
          <form @submit.prevent="registerUser">
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
            <button type="submit" class="btn btn-primary w-100">Register</button>
            <p v-if="successMessage" class="text-success mt-2 text-center">{{ successMessage }}</p>
            <p v-if="errorMessage" class="text-danger mt-2 text-center">{{ errorMessage }}</p>
          </form>
        </div>
      </div>
    `,
  };
  
  