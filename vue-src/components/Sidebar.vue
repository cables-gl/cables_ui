<template>
  <div id="icon-bar" :class="{hidden: !isVisible}">
    <ul>
      <li v-for="item in items" @click='callFunction(item.cmd)'>
        <span class="icon icon-1_5x" :class="[item.iconClass]"></span>
        <span v-if="displayIconLabel" class="label">{{ item.cmd }}</span>
      </li>
      <li class="menu" @click='callFunction("show command pallet")'>
        <span class="icon icon-1.5x icon-three-dots tt" data-tt="Add / remove icons"></span>
      </li>
    </ul>
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
    callFunction : function(action){
      CABLES.CMD.exec(action);
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      // code that assumes this.$el is in-document
      this.$store.dispatch('sidebar/setDefaultItems'); // add default items to sidebar
      this.$store.dispatch('sidebar/loadLocalStorage'); // add / remove items based on local storage
    })
  }
}
</script>

<style lang="scss" src="./Sidebar.scss"></style>
