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
    Vue.vueDragula.options('sidebar-bag', {
      direction: 'vertical',
      revertOnSpill: true,
      accepts: acceptsDrop,
      // copySortSource: false,
      // moves: function (el, source, handle, sibling) {
      //   console.log("moves");
      //   return false; // elements are always draggable by default
      // },
      // invalid: function (el, handle) {
      //   //return false; // don't prevent any drags from initiating by default
      //   return true;
      // },
    })
  }
})

function acceptsDrop(el, target, source, sibling) {
  let sourceId = source.getAttribute('id');
  let targetId = target.getAttribute('id');
  if(sourceId === 'sidebar-list') {
    if(targetId === sourceId) {
      return true;
    }
    return false;
  } else if(sourceId === 'sidebar-customizer-list') {
    if(targetId === 'sidebar-list') {
      return true;
    }
    return false;
  }
  return false;
}
