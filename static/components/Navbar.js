import store from "../utils/store.js";
import router from "../script.js";

export default {
  data() {
    return {
      user: null, // Stores user details after login
    };
  },
  computed: {
    loggedIn() {
        return store.state.loggedIn;
    },

    role(){
        return store.state.role;
    },
  },
  methods: {
    logout() {
      console.log(store.state.loggedIn);
        store.commit("logout");
        console.log(store.getters.getLoginData);
        console.log("LogOut Successful");
        router.push("/main_login");
    },
  },
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container-fluid">
    <!-- Logo -->
    <a class="navbar-brand" href="#">A To Z HS</a>

    <!-- Navbar Links -->
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <!-- Admin Links -->
        <template v-if="role === 'admin' && loggedIn">
          <li class="nav-item"><router-link to="/admin_home" class="nav-link">Admin Home</router-link></li>
          <li class="nav-item"><router-link to="/admin_search" class="nav-link">Search</router-link></li>
          <li class="nav-item"><router-link to="/admin_stats" class="nav-link">Statistics & Graphs</router-link></li>
        </template>

        <!-- Customer Links -->
        <template v-if="role === 'customer' && loggedIn">
          <li class="nav-item"><router-link to="/cust_home" class="nav-link">Customer Home</router-link></li>
          <li class="nav-item"><router-link to="/cust_search" class="nav-link">Search</router-link></li>
        </template>

        <!-- Professional Links -->
        <template v-if="role === 'professional' && loggedIn">
          <li class="nav-item"><router-link to="/prof_home" class="nav-link">Professional Home</router-link></li>
          <li class="nav-item"><router-link to="/prof_search" class="nav-link">Search</router-link></li>
        </template>

        <ul class="navbar-nav ms-auto">
        <!-- General Links (Visible only if NOT logged in) -->
        <template v-if="!loggedIn">
          <li class="nav-item"><router-link to="/main_login" class="nav-link">Login</router-link></li>
          <li class="nav-item"><router-link to="/cust_register" class="nav-link">Register as Customer</router-link></li>
          <li class="nav-item"><router-link to="/prof_register" class="nav-link">Register as Professional</router-link></li>
        </template>
        </ul>

        <!-- Logout -->
        <li class="nav-item" v-show="loggedIn">
          <a class="nav-link text-danger" @click="logout" style="cursor: pointer;">Logout</a>
        </li>
      </ul>
    </div>
  </div>
</nav>

  `,
};