<template>
  <div class="vue">
    <sidebar></sidebar>
    <sidebar-customizer></sidebar-customizer>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import SidebarCustomizer from './components/SidebarCustomizer.vue'

export default {
  name: 'app',
  components: {
    Sidebar,
    SidebarCustomizer
  }
}
</script>

<style lang="scss">

</style>
