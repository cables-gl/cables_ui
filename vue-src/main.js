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
      direction: 'vertical', // append new items vertically
      revertOnSpill: true, // move back when dropped in nomansland
      copySortSource: false, // forbid sorting in customizer
      accepts: acceptsDrop, // decides if container accepts dragged element
      copy: copy, // decides if dragged element should be copied or moved
    })
  }
})

/*
 * Called for every dragged element, customizer->sidebar will be copied,
 * items dragged to the trash will be moved
 */
function copy(el, source) {
  const sourceId = source.getAttribute('id');
  return sourceId === 'sidebar-customizer-list'; // if source is customizer copy, else move
}

/*
 * Called on drag, decides if the container acceps a dragged element
 */
function acceptsDrop(el, target, source, sibling) {
  let sourceId = source.getAttribute('id');
  let targetId = target.getAttribute('id');
  if(sourceId === 'sidebar-list') {
    if(targetId === sourceId) {
      return true;
    } else if(targetId === 'sidebar-customizer-trash-can') {
      return true;
    }
    return false;
  } else if(sourceId === 'sidebar-customizer-list') {
    if(targetId === 'sidebar-list') {
      // duplicate check
      const cmdName = el.getAttribute('data-cmd');
      console.log(cmdName);
      return true;
    }
    return false;
  }
  return false;
}
