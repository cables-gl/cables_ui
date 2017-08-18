<template>
  <div id="icon-bar" :class="{hidden: !isVisible}">
    <ul v-dragula="items" id="sidebar-list" bag="sidebar-bag">
      <li 
          :data-cmd="item.cmd" 
          :data-tt="displayIconLabel ? null : item.cmd" 
          :class="{ tt: !displayIconLabel }"
          v-for="item in items" 
          :key="getKey(item)" 
          @click='callFunction(item.cmd)'>
        <span class="icon icon-1_5x" :class="[item.iconClass]"></span>
        <span v-if="displayIconLabel" class="label">{{ item.cmd }}</span>
      </li>
    </ul>
    <div class="menu" @click='toggleCustomizer'>
      <span class="icon icon-1.5x icon-three-dots tt" data-tt="Add / remove icons"></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'sidebar',
  computed: {
    items() {
      return this.$store.state.sidebar.items;
    },
    isVisible() {
      return this.$store.state.sidebar.visible;
    },
    displayIconLabel() {
      return this.$store.state.sidebar.displayText;
    }
  },
  methods : {
    toggleCustomizer() {
      this.$store.dispatch('sidebar/toggleCustomizerVisibility');
    },
    getKey: (item) => `${item.cmd}-sb-${Math.floor(Math.random()*10000)}`,
    callFunction : function(action){
      CABLES.CMD.exec(action);
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.$store.dispatch('sidebar/initSidebar');
      // add / remove items based on local storage, set default items, which were not removed
      this.$store.dispatch('sidebar/loadLocalStorage');
    })
  }
}
</script>

<style lang="scss" src="./Sidebar.scss"></style>
