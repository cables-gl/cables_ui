// initial state
const state = {
    cookiesAccepted: false,
  }
  
// getters
const getters = {
    isCookieWarningVisible(state) {
        return !state.cookiesAccepted;
    },
    wereCookiesAccepted(state) {
        return state.cookiesAccepted;
    }
}

// mutations
const mutations = {
    setCookiesAccepted(state, b) {
        state.cookiesAccepted = b;
    },
}
  
// actions
const actions = {
    loadSettings(context) {
        const accepted =  CABLES.UI.userSettings.get('cookiesAccepted') ? true : false;
        console.log('loaded user settings: cookie: ', accepted);
        context.commit('setCookiesAccepted', accepted);
    },
    /*
     * Called when the user clicks on close, will write to local storage 
     */
    accept(context) {
        console.log('accepteeeeeed');
        context.commit('setCookiesAccepted', true);
        CABLES.UI.userSettings.set('cookiesAccepted', true);
    },
}

  export default {
    state,
    getters,
    actions,
    mutations
  }
  