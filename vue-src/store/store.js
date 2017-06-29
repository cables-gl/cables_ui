// Vuex data store, no ES6 in this file

var Vue = require('../../node_modules/vue/dist/vue.common.js');
var Vuex = require('vuex');

Vue.use(Vuex);

var store = new Vuex.Store({
  state: {
    /* icon bar displays action-items with an icon and text */
    iconBar: {
      visible: true,
      displayText: true, // shows text under the item
      items: [
        {
          'icon': 'fa-play',
          'title': 'Save Patch',
          'action': 'save patch'
        },
        {
          'icon': 'fa-forward',
          'title': 'Select All Ops',
          'action': 'select all ops'
        },
        {
          'icon': 'fa-backward',
          'title': 'Backward',
          'action': 'backward'
        }
      ]
    }
  },
  mutations: {
     addIconBarItem (state, item) {
      state.iconBar.items.push(item)
    }
  }
});

var exports = module.exports = store;
window.vueStore = store;
