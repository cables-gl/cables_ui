// Vue entry, no ES6 in this file
var Vue = require('../node_modules/vue/dist/vue.common.js');

var App = require('./App.vue');

var store = require('./store/index.js');

Vue.config.productionTip = false;


new Vue({
  el: '#vue-app',
  store,
  template: '<App />',
  components: { App }
})
