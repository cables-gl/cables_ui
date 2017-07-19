var Vue = require('../../node_modules/vue/dist/vue.common.js');
var Vuex = require('vuex');
// main actions / getters
// import * as actions from './actions';
// import * as getters from './getters';
// modules stores
import sidebar from './modules/sidebar';

Vue.use(Vuex);

var store = new Vuex.Store({
  modules: {
    sidebar: {
      ...sidebar,
      namespaced: true,
    }
  },
  state: {},
  mutations: {},
  getters: {}
});

var exports = module.exports = store;
window.vueStore = store;
