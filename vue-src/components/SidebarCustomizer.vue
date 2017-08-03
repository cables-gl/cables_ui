<template>
  <transition name="customizer-animation">
    <div v-show="visible" ref="sidebar-customizer" class="sidebar-customizer">
      <div v-dragula="trashedItems" bag="sidebar-bag" id="sidebar-customizer-trash-can" v-show="trashCanVisible">
        <div class="icon-wrapper">
          <div class="icon icon-trash"></div>
        </div>
      </div>
      <div v-show="!trashCanVisible" class="sidebar-customizer-main">
        <div class="close-wrapper">
          <a class="icon-x icon icon-1_5x" @click="toggleCustomizer"></a>
        </div>
        <header>
          <input type="search" id="customizer-search" @keyup="search($event.target.value)" @search="search($event.target.value)" placeholder="search for a command" />
          <div class="sidebar-option">
            <span>Display:</span> <app-switch id="display-text-icon-switch" classes="" v-model="displayLabel" checked>{{ displayLabelStateText }}</app-switch>
          </div>
        </header>
        <ul v-dragula="items" id="sidebar-customizer-list" bag="sidebar-bag">
          <li v-for="item in items" :key="getKey(item)" >
            <span class="icon icon-1_5x" :class="[item.iconClass]"></span>
            <span class="label">{{ item.cmd }}</span>
          </li>
        </ul>
        <p id="ux-hint">
          Drag’n’drop any icon to the sidebar to add it, <br />
          drag an icon here to remove it.
        </p>
      </div>
    </div>
  </transition>
</template>

<script>
import Switch from './Switch.vue';

export default {
  mounted: function () {
    this.$nextTick(function () {
      let drake = Vue.vueDragula.find("sidebar-bag").drake;
      drake.on('drop', this.handleDrop);
      drake.on('dragend', this.handleDragEnd);
      drake.on('drag', this.handleDrag);
      drake.on('over', this.handleDragOver);
      drake.on('out', this.handleDragOut);
    })
  },
  computed: {
    displayLabelStateText() {
      return this.$store.state.sidebar.displayText ? 'Text & Icon' : 'Icon only'
    },
    displayLabel: {
      get() { return this.$store.state.sidebar.displayText },
      set(value) { this.$store.commit('sidebar/displayText', value); },
    },
    visible() {
      return this.$store.state.sidebar.customizerVisible;
    },
    trashCanVisible() {
      return this.$store.state.sidebar.customizerTrashCanVisible;
    },
    key() {
      return Math.random() * 10000000;
    },
    trashedItems() {
      return this.$store.state.sidebar.trashedItems;
    },
    items() {
      return this.$store.state.sidebar.customizerItems;
    },
  },
  methods: {
    search(text) { this.$store.commit('sidebar/filterCustomizerItems', text); },
    getKey: (item) => `${item.cmd}-origin-sidebar`,
    toggleCustomizer() { this.$store.dispatch('sidebar/toggleCustomizerVisibility'); },
    handleDrag (el, source) {
      const sourceId = source.getAttribute('id');
      if(sourceId === 'sidebar-list') {
        this.$store.commit('sidebar/setTrashCanVisible', true);
      }
    },
    handleDrop (el, target, source, sibling) {
      // console.log("DROP");
      const targetId = target.getAttribute('id');
      const sourceId = source.getAttribute('id');
      if(sourceId === 'sidebar-list' && targetId === 'sidebar-customizer-trash-can') {
        const elCmd = el.getAttribute('data-cmd');
        this.$store.commit('sidebar/removeItem', elCmd);
      } else { // reorder in sidebar or new item added

      }
      this.$store.dispatch('sidebar/writeLocalStorage');
    },
    handleDragEnd (el) {
      // console.log("DRAG END");
      this.$store.commit('sidebar/setTrashCanVisible', false);
      var trashContainer = document.getElementById("sidebar-customizer-trash-can");
      trashContainer.classList.remove("drag-over");
    },
    handleDragOver (el, container, source) {
      // console.log("DRAG OVER");
      const containerId = container.getAttribute('id');
      if(containerId === 'sidebar-customizer-trash-can') {
        container.classList.add("drag-over");
      }
    },
    handleDragOut (el, container, source) {
      // console.log("DRAG OUT");
      const containerId = container.getAttribute('id');
      if(containerId === 'sidebar-customizer-trash-can') {
        container.classList.remove("drag-over");
      }
    },
  },
  components: {
    'AppSwitch': Switch,
  },
}

</script>

<style lang="scss" src="./SidebarCustomizer.scss"></style>
<!-- <style lang="scss" src="./Sidebar.scss"></style> -->
