// Vue entry, no ES6 in this file
var Vue = require('../node_modules/vue/dist/vue.common.js');
var VueDragula = require('vue-dragula');

var App = require('./App.vue');

var store = require('./store/index.js');

Vue.config.productionTip = false;
window.Vue = Vue;

Vue.use(VueDragula);

new Vue({
  el: '#vue-app',
  store,
  template: '<App />',
  components: { App },
  created: function () {
    Vue.vueDragula.options([document.querySelector('#sidebar-list'), document.querySelector('#sidebar-customizer-list')], {
      direction: 'vertical'
    })
  }
})
