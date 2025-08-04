// Function to load the state from localStorage
function loadState() {
    const savedState = localStorage.getItem('vuexState');  // Retrieve saved state from localStorage
    return savedState ? JSON.parse(savedState) : {};       // Parse and return the state, or return empty object
  }
  
  const store = new Vuex.Store({
     state: {
      loggedIn : false,
      role : "",
      userId: -1,
      token: "",
      userName: "",
      profID: -1,
      ...loadState(),  // Merge loaded state from localStorage with the default state
     },
  
     getters: {
      getLoginData(state) {
          return {
              loggedIn: state.loggedIn,
              role: state.role,
              userId: state.userId,
              token: state.token,
              userName: state.userName,
              profID: state.profID
          };
      },
     },
  
     mutations: {
      setlogin(state, payload){
          state.loggedIn = true;
          state.role = payload[0];
          state.userId = payload[1];
          state.token = payload[2];
          state.userName = payload[3].split('@')[0];
          state.profID = payload[4];
          localStorage.setItem('vuexState', JSON.stringify(state));  // Save updated state to localStorage
      },
      logout(state){
          state.loggedIn = false;
          state.userId = -1;
          state.role = "";
          state.token = "";
          state.userName = "";
          state.profID = -1;
          localStorage.setItem('vuexState', JSON.stringify(state));  // Save logged out state to localStorage
      },
     },
  });
  
  // Watch for any state changes and persist them to localStorage
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuexState', JSON.stringify(state));  // Store entire state whenever any mutation occurs
  });
  
  export default store;