// Vue entry, no ES6 in this file
var Vue = require('../node_modules/vue/dist/vue.common.js');
var App = require('./App.vue');

var store = require('./store/index.js');

Vue.config.productionTip = false;

// var iconBarData = [
//   {
//     'icon': 'fa-play',
//     'title': 'Play',
//     'action': 'play'
//   },
//   {
//     'icon': 'fa-forward',
//     'title': 'Forward',
//     'action': 'forward'
//   },
//   {
//     'icon': 'fa-backward',
//     'title': 'Backward',
//     'action': 'backward'
//   }
// ];

window.cablesFunctions = {
  'play': function() {
    alert("play");
  },
  'forward': function() {
    alert("forward");
  },
  'backward': function() {
    alert("backward");
  }
};

window.callCablesFunction = function(functionName) {
    if(window.cablesFunctions.hasOwnProperty(functionName)) {
      window.cablesFunctions[functionName]();
    }
};

new Vue({
  el: '#vue-app',
  store,
  template: '<App :title="title" />',
  data: {
    'title': 'Heloo???'
  },
  components: { App }
})
