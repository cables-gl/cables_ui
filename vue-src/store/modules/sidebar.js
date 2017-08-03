// initial state
const state = {
  visible: true, // if sidebar is visible
  customizerVisible: false, // if customizer is visible
  customizerTrashCanVisible: false, // shows the trashcan on drop over, so items can be removed
  displayText: true, // shows text under the item
  defaultIcon: 'icon-square',
  defaultItems: ['create new patch', 'save patch', 'add op', 'show settings', 'toggle fullscreen'],
  items: [],
  allItems: [],
  customizerItems: [], // items currently being displayed in customizer
  trashedItems: [], // items dropped into the trash can, needed by dragula lib
  removedDefaultItems: [], // will be written to local storage
}

// getters
const getters = {
  iconBarContainsCmd(state) {
    return (cmd) => state.items.filter(function(e) { return e.cmd === cmd }).length > 0
  },
  sidebarCustomizerVisible(state) {
    return state.customizerVisible;
  },
}

var uniqArr = (arrArg) => {
  return arrArg.filter((elem, pos, arr) => {
    return arr.indexOf(elem) == pos;
  });
}

// actions
const actions = {
  initSidebar(context) { // Fixes weird bug inside dragula, when array is epmty
    context.commit('addItem', context.state.defaultItems[0]);
    context.commit('removeItem', context.state.defaultItems[0]);
  },
  setDefaultItems(context) {
    for(let i=0; i<context.state.defaultItems.length; i++) {
      context.commit('addItem', context.state.defaultItems[i]);
    }
  },
  toggleCustomizerVisibility(context) {
    context.commit('setCustomizerVisible', !context.state.customizerVisible);
  },
  writeLocalStorage(context) {
    const obj = {
      visible: context.state.visible,
      displayText: context.state.displayText,
      items: context.state.items.map((item) => item.cmd),
      removedDefaultItems: uniqArr(context.state.removedDefaultItems.filter((cmd) => !context.state.items.some((item) => cmd === item.cmd))), // only add items which are not in the items list right now
    };
    // console.log("wrting to local storage: ", obj);
    CABLES.UI.userSettings.set('sidebar', obj);
  },
  loadLocalStorage(context) {
    const sidebarSettings = CABLES.UI.userSettings.get('sidebar');
    // console.log("sidebarSettings", sidebarSettings);
    if(sidebarSettings) {
      if(sidebarSettings.visible) { context.commit('visible', sidebarSettings.visible); }
      if(sidebarSettings.displayText) { context.commit('displayText', sidebarSettings.displayText); }
      if(sidebarSettings.removedDefaultItems) { context.commit('setRemovedDefaultItems', sidebarSettings.removedDefaultItems); }
      if(sidebarSettings.items) {
        // first version, changed structure, userAction no longer exists
        // for(let i=0; i<sidebarSettings.items.length; i++) {
        //   const item = sidebarSettings.items[i];
        //   var cmdObj = CABLES.CMD.getCmd(item.cmd);
        //   if(item.userAction === 'add') {
        //     context.commit('addItem', item.cmd);
        //   } else {
        //     context.commit('removeItem', item.cmd);
        //   }
        // }
        for(let i=0; i<sidebarSettings.items.length; i++) {
          context.commit('addItem', sidebarSettings.items[i]);
        }
      }
    }
    if(!sidebarSettings || !sidebarSettings.items) {
      context.dispatch('setDefaultItems');
    }
    else {
      if(sidebarSettings.removedDefaultItems) {
        // add default icons if they are not on the removed list
        context.state.defaultItems.forEach((defaultItem) => {
          if(!sidebarSettings.removedDefaultItems.some((removedItem) => removedItem === defaultItem)) {
            context.commit('addItem', defaultItem);
          } else {

          }
        });
      } else {
        context.dispatch('setDefaultItems');
      }
    }
  }
}

// mutations
const mutations = {
  setRemovedDefaultItems(state, cmds) {
    if(!cmds) { return; }
    cmds.forEach((cmd) => {
      if(state.defaultItems.some((defaultItem) => defaultItem.cmd === cmd) // if it really is a default item
          && !state.removedDefaultItems.includes(cmd)) { // and no duplicate
        state.removedDefaultItems.push(cmd);
      }
    });
  },
  setCustomizerVisible(state, b) {
    state.customizerVisible = b;
  },
  setTrashCanVisible(state, b) {
    state.customizerTrashCanVisible = b;
  },
  filterCustomizerItems(state, searchText) {
    state.customizerItems.splice(0, state.customizerItems.length); // clear
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
    if(!cmdName) { return; }
    for(let i=0; i<state.items.length; i++) {
      if(state.items[i].cmd === cmdName) {
        state.items.splice(i, 1);
        function isDefaultItem (cmd) { return state.defaultItems.some((defaultItem) => defaultItem === cmdName); }
        if(isDefaultItem(cmdName) && !state.removedDefaultItems.indexOf(cmdName) > -1) {
          state.removedDefaultItems.push(cmdName);
        }
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
