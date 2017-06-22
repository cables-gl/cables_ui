<template>
  <div id="icon-bar" :class="{hidden: !isVisible}">
    <!-- <hello></hello> -->
    <ul>
      <li v-for="item in items" @click='callFunction(item.action)'>
        <span class="fa icon" :class="[item.icon]"></span>
        <span>{{ item.title }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import Hello from './components/Hello.vue'

export default {
  name: 'app',
  components: {
    Hello
  },
  props: [
    'title'
  ],
  computed: {
    items() {
      return this.$store.state.iconBar.items;
    },
    isVisible() {
      return this.$store.state.iconBar.visible;
    }
  },
  methods : {
    callFunction : function(action){
      // cablesFunctions[action]();
      callCablesFunction(action);
    }
  }
}
</script>

<style lang="scss">
#icon-bar {
  padding-top: 28px;
  background-color: black;
  position: fixed;
  top: 0;
  left: 0;
  width: 80px;
  height: 100vh;
  color: #2c3e50;

  ul {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      cursor: pointer;
      margin-bottom: 20px;
      margin-top: 20px;
      padding: 8px;

      &:hover {
        * {
          color: cyan;
        }
      }

      span {
        display: block;
        text-align: center;

        &.icon {
          margin-bottom: 6px;
        }
      }
    }
  }
}
</style>
