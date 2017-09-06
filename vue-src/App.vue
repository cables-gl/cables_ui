<template>
  <div class="vue">
    <sidebar></sidebar>
    <sidebar-customizer-background></sidebar-customizer-background>
    <sidebar-customizer></sidebar-customizer>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import SidebarCustomizer from './components/SidebarCustomizer.vue'
import SidebarCustomizerBackground from './components/SidebarCustomizerBackground.vue'

export default {
  name: 'app',
  components: {
    Sidebar,
    SidebarCustomizer,
    SidebarCustomizerBackground,
  }
}
</script>

<style lang="scss">

</style>
