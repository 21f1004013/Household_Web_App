import store from "../utils/store.js";


export default {
    data() {
      return {
        email: "",
        password: "",
        errorMessage: "",
      };
    },
    methods: {
      async loginUser() {
        try {
          const response = await fetch("/main_login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: this.email,
              password: this.password,
            }),
          });
      
          // Debugging logs
          console.log("Login response status:", response.status);
      
          const userData = await response.json();
          console.log("Login response data:", userData);
      
          if (!response.ok) {
            throw new Error(userData.error || "Invalid email or password.");
          }
      
          // Store user data in the vuex store
          store.commit("setlogin", [userData.role, userData.user_id, userData.token, userData.user_name]);
      
          // Redirect based on role
          if (userData.role === "admin") {
            this.$router.push("/admin_home");
          } else if (userData.role === "professional") {
            this.$router.push("/prof_home");
          } else {
            this.$router.push("/cust_home");
          }
        } catch (error) {
          console.error("Login error:", error.message);
          this.errorMessage = error.message;
        }
      },
    },
    template: `
      <div class="login-container">
        <div class="card p-4 shadow-sm">
          <h3 class="text-center">Login</h3>
          <form @submit.prevent="loginUser">
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input v-model="email" type="email" id="email" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input v-model="password" type="password" id="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
            <p v-if="errorMessage" class="text-danger mt-2 text-center">{{ errorMessage }}</p>
          </form>
        </div>
      </div>
    `,
  };
  
  