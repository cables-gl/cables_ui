<template>
  <div class="sidebar-customizer">
    <ul v-dragula="items" id="sidebar-customizer-list">
      <li v-for="item in items" :key="key" >
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
      let bag = Vue.vueDragula.find('sidebar-list');
      console.log(bag);
      let bag2 = Vue.vueDragula.find('first-bag');
      console.log(bag2);
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
}
</script>

<style lang="scss" src="./SidebarCustomizer.scss"></style>
