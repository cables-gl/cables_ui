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

}

// mutations
const mutations = {
  displayIconBarText(state, b) {
    state.displayText = b;
  },
   addIconBarItem (state, item) {
    //  if(!item) { return; }
     if(state.items.filter(function(e) { return e.cmd === item.cmd }).length > 0) { // only add if it does not exist
       state.items.push(item);
     }
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
