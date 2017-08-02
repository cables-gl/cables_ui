// initial state
const state = {
  visible: true, // if sidebar is visible
  customizerVisible: false, // if customizer is visible
  customizerTrashCanVisible: false, // shows the trashcan on drop over, so items can be removed
  displayText: true, // shows text under the item
  defaultIcon: 'icon-square',
  defaultItems: ['create new patch', 'save patch', 'add op', 'show settings'],
  items: [],
  allItems: [],
  customizerItems: [], // items currently being displayed in customizer
  trashedItems: [], // items dropped into the trash can, needed by dragula lib
}

// getters
const getters = {
  iconBarContainsCmd(state) {
    return (cmd) => state.items.filter(function(e) { return e.cmd === cmd }).length > 0
  },
}

// actions
const actions = {
  setDefaultItems(context) {
    for(let i=0; i<context.state.defaultItems.length; i++) {
      context.commit('addItem', context.state.defaultItems[i]);
    }
  },
  toggleCustomizerVisibility(context) {
    context.commit('setCustomizerVisible', !context.state.customizerVisible);
  },
  loadLocalStorage(context) {
    const sidebarSettings = CABLES.UI.userSettings.get('sidebar');
    if(sidebarSettings) {
      if(sidebarSettings.visible) { context.commit('visible', sidebarSettings.visible); }
      if(sidebarSettings.displayText) { context.commit('displayText', sidebarSettings.displayText); }
      if(sidebarSettings.items) {
        for(let i=0; i<sidebarSettings.items.length; i++) {
          const item = sidebarSettings.items[i];
          var cmdObj = CABLES.CMD.getCmd(item.cmd);
          if(item.userAction === 'add') {
            context.commit('addItem', item.cmd);
          } else {
            context.commit('removeItem', item.cmd);
          }
        }
      }
    }
  }
}

// mutations
const mutations = {
  setCustomizerVisible(state, b) {
    state.customizerVisible = b;
  },
  setTrashCanVisible(state, b) {
    state.customizerTrashCanVisible = b;
  },
  filterCustomizerItems(state, searchText) {
    state.customizerItems.splice(0, state.customizerItems.length); // clear
    state.allItems.forEach(item => {

    });
    if(!searchText) {
      state.allItems.forEach((item) => {
        state.customizerItems.push(Object.assign({}, item));
      });
    } else {
      function contains(text) {
        return function(element) {
          return element.cmd.indexOf(text) > -1 || element.category.indexOf(text) > -1;
        }
      }

      state.allItems.filter(contains(searchText)).forEach((item) => {
        state.customizerItems.push(Object.assign({}, item));  
      });
    }
  },
  setAllItems(state, items) {
    items.forEach(item => {
      const cmdObj = {
        cmd: item.cmd,
        category: item.category,
        iconClass: (item.icon ? `icon-${item.icon}` : state.defaultIcon),
      };
      state.customizerItems.push(cmdObj);
      state.allItems.push(Object.assign({}, cmdObj));
    });
  },
  displayText(state, b) {
    state.displayText = b;
  },
  visible(state, b) {
    state.visible = b;
  },
  removeItem(state, cmdName) {
    if(!cmdName) { return; }
    for(let i=0; i<state.items.length; i++) {
      if(state.items.length[i].cmd === cmdName) {
        state.items.splice(i, 1);
        break;
      }
    }
  },
  addItem(state, cmdName) {
   if(!cmdName) { return; }
   if(state.items.filter(function(e) { return e.cmd === cmdName }).length === 0) { // only add if it does not exist
     var item = CABLES.CMD.getCmd(cmdName);
     if(!item) {
      //  console.error('Could not add command to sidebar - not found! Command name: ', cmdName); // TODO: log
       return;
     }
     var itemToAdd = {
       cmd: item.cmd,
       category: item.category,
       iconClass: (item.icon ? 'icon-' + item.icon : state.defaultIcon),
     };
     state.items.push(itemToAdd);
   }
  },
  removeItem(state, cmdName) {
    for(let i=0; i<state.items.length; i++) {
      if(state.items[i].cmd === cmdName) {
        state.items.splice(i, 1);
        break;
      }
    }
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
