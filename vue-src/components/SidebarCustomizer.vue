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
      drake.on('drop', (el, target, source, sibling) => {
        console.log("drop:---------------------");
        console.log("el: ", el);
        console.log("target", target);
        const targetId = target.getAttribute('id');
        console.log("target id: ", targetId);
        console.log("source", source);
        const sourceId = source.getAttribute('id');
        console.log("source id: ", sourceId);
        console.log("sibling", sibling);
        if(sourceId === 'sidebar-list' && targetId === 'sidebar-customizer-trash-can') {
          console.log("dropped on trash");
          const elCmd = el.getAttribute('data-cmd');
          console.log("cmd to delete: ", elCmd);
          this.$store.commit('sidebar/removeItem', elCmd);
        }
      });
      drake.on('dragend', (el) => {
        this.$store.commit('sidebar/setTrashCanVisible', false);
        var trashContainer = document.getElementById("sidebar-customizer-trash-can");
        trashContainer.classList.remove("drag-over");
      });
      drake.on('drag', (el, source) => {
        console.log("drag:---------------------");
        console.log("el", el);
        console.log("source", source);
        const sourceId = source.getAttribute('id');
        console.log("source id: ", sourceId);
        if(sourceId === 'sidebar-list') {
          this.$store.commit('sidebar/setTrashCanVisible', true);
        }
      });
      drake.on('over', (el, container, source) => {
        console.log("over:---------------------");
        console.log("el", el);
        const containerId = container.getAttribute('id');
        console.log("container: ", containerId);
        console.log("source", source);
        const sourceId = source.getAttribute('id');
        console.log("source id: ", sourceId);
        if(containerId === 'sidebar-customizer-trash-can') {
          container.classList.add("drag-over");
        }
      });
      drake.on('out', (el, container, source) => {
        const containerId = container.getAttribute('id');
        if(containerId === 'sidebar-customizer-trash-can') {
          container.classList.remove("drag-over");
        }
      });
      //window.addEventListener('keyup', this.checkEscapeKey)
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
    checkEscapeKey(e) {
      console.log("escape");
      if(e.keyCode === 27) { // escape
        this.$store.dispatch('sidebar/toggleCustomizerVisibility');
        e.preventDefault();
        e.stopPropagation();
      }
    },
    search(text) {
      console.log("search:", text);
      // TODO: Erase text on Escape
      this.$store.commit('sidebar/filterCustomizerItems', text);
    },
    getKey: (item) => `${item.cmd}-origin-sidebar`,
    toggleCustomizer() {
      this.$store.dispatch('sidebar/toggleCustomizerVisibility');
    },
  },
  components: {
    'AppSwitch': Switch,
  },
}

function dropOnTrashCan() {

}
</script>

<style lang="scss" src="./SidebarCustomizer.scss"></style>
<!-- <style lang="scss" src="./Sidebar.scss"></style> -->
