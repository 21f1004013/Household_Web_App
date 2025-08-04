import Home from "./components/Home.js"
import Login from "./components/Login.js"
import ProfRegister from "./components/ProfRegister.js"
import CustomerRegister from "./components/CustomerRegister.js"
import Navbar from "./components/Navbar.js"
import AdminHome from "./components/AdminHome.js"
import CustomerHome from "./components/CustomerHome.js"
import ProfessionalHome from "./components/ProfessionalHome.js"
import AdminSearch from "./components/AdminSearch.js"
import CustomerSearch from "./components/CustomerSearch.js"
import ProfSearch from "./components/ProfSearch.js"
import AdminStats from "./components/AdminStats.js"

import store from "./utils/store.js";

const routes = [
    { path: '/', component: Home },
    { path: '/main_login', component: Login },
    { path: '/prof_register', component: ProfRegister },
    { path: '/cust_register', component: CustomerRegister },
    { path: '/admin_home', component: AdminHome },
    { path: '/cust_home', component: CustomerHome },
    { path: '/prof_home', component: ProfessionalHome },
    { path: '/admin_search', component: AdminSearch },
    { path: '/cust_search', component: CustomerSearch },
    { path: '/prof_search', component: ProfSearch },
    { path: '/admin_stats', component: AdminStats },
]

const router = new VueRouter({
    routes: routes
})


const app = new Vue({
    el:"#app",
    router,
    store,
    template:`
    <div>
    <nav-bar></nav-bar>
    <router-view></router-view>
    </div>
    `,
    data: {
        // Define your data here
    },
    methods: {
        // Define your methods here
    },
    components: {
        "nav-bar":Navbar,
    }

})

export default router;