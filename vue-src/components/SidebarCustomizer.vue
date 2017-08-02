<template>
  <div v-show="visible" class="sidebar-customizer">
    <div v-dragula="trashedItems" bag="sidebar-bag" id="sidebar-customizer-trash-can" v-show="trashCanVisible">
      trashhhhhhhhhhhh
    </div>
    <ul v-dragula="items" id="sidebar-customizer-list" bag="sidebar-bag">
      <li v-for="item in items" :key="getKey(item)" @click="callFunction(item.cmd)" >
        <span class="icon icon-1_5x" :class="[item.iconClass]"></span>
        <span class="label">{{ item.cmd }}</span>
      </li>
    </ul>
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
        console.log("target id: ", target.getAttribute('id'));
        console.log("source", source);
        const sourceId = source.getAttribute('id');
        console.log("source id: ", sourceId);
        console.log("sibling", sibling);
        if(sourceId === 'sidebar-list') {
          console.log("dropped on trash");
          const elCmd = el.getAttribute('data-cmd');
          console.log("cmd to delete: ", elCmd);
          this.$store.commit('sidebar/removeItem', elCmd);
        }
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
        console.log("container: ", container.getAttribute('id'));
        console.log("source", source);
        const sourceId = source.getAttribute('id');
        console.log("source id: ", sourceId);
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
      return this.$store.state.sidebar.allItems;
    },
  },
  methods: {
    getKey: (item) => `${item.cmd}-origin-sidebar`,
    callFunction : function(action){
      CABLES.CMD.exec(action);
    }
  }
}

function dropOnTrashCan() {

}
</script>

<style lang="scss" src="./SidebarCustomizer.scss"></style>
<!-- <style lang="scss" src="./Sidebar.scss"></style> -->
