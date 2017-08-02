<template>
  <div v-show="visible" class="sidebar-customizer">
    <div v-dragula="trashedItems" bag="sidebar-bag" id="sidebar-customizer-trash-can" v-show="trashCanVisible">
      <div class="icon-wrapper">
        <div class="icon icon-trash"></div>
      </div>
    </div>
    <div v-show="!trashCanVisible" class="sidebar-main">
      <div class="close-wrapper">
        <a class="icon-x icon icon-1_5x" @click="toggleCustomizer"></a>
      </div>
      <header>
        <input type="text" id="customizer-search" v-on:keyup="search($event.target.value)" placeholder="search for a command" />
      </header>
      <ul v-dragula="items" id="sidebar-customizer-list" bag="sidebar-bag">
        <li v-for="item in items" :key="getKey(item)" @click="callFunction(item.cmd)" >
          <span class="icon icon-1_5x" :class="[item.iconClass]"></span>
          <span class="label">{{ item.cmd }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
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
    })
  },
  computed: {
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
    search(text) {
      console.log("search:", text);
      this.$store.commit('sidebar/filterCustomizerItems', text);
    },
    getKey: (item) => `${item.cmd}-origin-sidebar`,
    callFunction : function(action){
      CABLES.CMD.exec(action);
    },
    toggleCustomizer() {
      this.$store.dispatch('sidebar/toggleCustomizerVisibility');
    },
  }
}

function dropOnTrashCan() {

}
</script>

<style lang="scss" src="./SidebarCustomizer.scss"></style>
<!-- <style lang="scss" src="./Sidebar.scss"></style> -->
