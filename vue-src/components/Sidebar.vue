<template>
  <div id="icon-bar" :class="{hidden: !isVisible}">
    <!-- <hello></hello> -->
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
// import Hello from './Hello.vue'

export default {
  name: 'app',
  components: {
    // Hello
  },
  // props: [
  //   'title'
  // ],
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

<style lang="scss">
#icon-bar {
  // display: none;
  padding-top: 28px;
  background-color: black;
  position: fixed;
  top: 0;
  left: 0;
  width: 80px;
  height: 100vh;
  color: #2c3e50;

  ul {
    height: 100%;
    position: relative;
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      cursor: pointer;
      margin-top: 12px;
      padding: 8px;

      &:hover {
        .label {
          color: cyan;
        }
        .icon {
          background-color: cyan;
        }
      }

      &.menu {
        position: absolute;
        width: 100%;
        bottom: 54px;
        display: block;
        box-sizing: border-box;
      }

      span {
        display: block;
        text-align: center;

        &.icon {
		  margin: 0 auto;
          margin-bottom: 6px;
        }
      }
    }
  }
}
</style>
