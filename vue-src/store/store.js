// Vuex data store, no ES6 in this file

var Vue = require('../../node_modules/vue/dist/vue.common.js');
var Vuex = require('vuex');

Vue.use(Vuex);

// var exports = module.exports= {};
var store = new Vuex.Store({
  state: {
    counter: 1,
    iconBar: {
      visible: true,
      displayText: true,
      items: [
        {
          'icon': 'fa-play',
          'title': 'Play',
          'action': 'play'
        },
        {
          'icon': 'fa-forward',
          'title': 'Forward',
          'action': 'forward'
        },
        {
          'icon': 'fa-backward',
          'title': 'Backward',
          'action': 'backward'
        }
      ]
    }
  }
});

var exports = module.exports = store;
window.vueStore = store;
