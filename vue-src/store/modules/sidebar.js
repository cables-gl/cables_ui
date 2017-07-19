// initial state
const state = {
  visible: true,
  displayText: true, // shows text under the item
  items: [
    {
      cmd: 'search',
      category: 'ui',
      iconClass: 'icon-search',
      hotkey: 'CMD + f'
    }
  ]
}

// getters
const getters = {
  iconBarContainsCmd(state, cmd) {
    return state.items.filter(function(e) { return e.cmd === cmd }).length > 0
  }
}

// actions
const actions = {
  loadLocalStorage(context) {
    console.log("CABLES: ", CABLES);
    console.log("CABLES.UI: ", CABLES.UI);
    const sidebarSettings = CABLES.UI.userSettings.get('sidebar');
    if(sidebarSettings) {
      if(sidebarSettings.visible) { context.commit('visible', sidebarSettings.visible); }
      if(sidebarSettings.displayText) { context.commit('displayText', sidebarSettings.displayText); }
      if(sidebarSettings.items) {
        for(let i=0; i<sidebarSettings.items.length; i++) {
          context.commit('addItem', sidebarSettings.items[i]);
        }
      }
    }
    // context.commit('addItem', foo);
  }
}

// mutations
const mutations = {
  displayText(state, b) {
    state.displayText = b;
  },
  visible(state, b) {
    state.visible = b;
  },
  addItem(state, item) {
   if(!item) { return; }
   if(state.items.filter(function(e) { return e.cmd === item.cmd }).length === 0) { // only add if it does not exist
     state.items.push(item);
     CABLES.UI.userSettings.set('sidebar', state);
   }
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
