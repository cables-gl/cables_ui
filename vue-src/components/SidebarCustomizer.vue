<template>
  <div class="sidebar-customizer">
    <ul v-dragula="items" id="sidebar-customizer-list" bag="sidebar-bag">
      <li v-for="item in items" :key="getKey(item)" >
        <span class="icon icon-1_5x" :class="[item.iconClass]"></span>
        <span v-if="displayIconLabel" class="label">{{ item.cmd }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  mounted: function () {
    this.$nextTick(function () {
      let drake = Vue.vueDragula.find("sidebar-bag").drake;
      drake.on('droppp', (el, target, source, sibling) => {
        console.log("drop:---------------------");
        console.log("target", target);
        console.log("target id: ", target.getAttribute('id'));
        console.log("source", source);
        console.log("source id: ", source.getAttribute('id'));
        console.log("sibling", sibling);
      });
    })
  },
  computed: {
    key() {
      return Math.random() * 10000000;
    },
    items() {
      return this.$store.state.sidebar.allItems;
    },
  },
  methods: {
    getKey: (item) => `${item.cmd}-origin-sidebar`,
  }
}
</script>

<style lang="scss" src="./SidebarCustomizer.scss"></style>
