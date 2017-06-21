// var Vue = require('vue')
var Vue = require('../node_modules/vue/dist/vue.common.js');
var App = require('./App.vue');

Vue.config.productionTip = false;

var iconBarData = [
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
];

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

new Vue({
  el: '#vue-app',
  template: '<App :icon-bar-data="iconBarData" :title="title" />',
  data: {
    'iconBarData': iconBarData,
    'title': 'Heloo???'
  },
  components: { App }
})
