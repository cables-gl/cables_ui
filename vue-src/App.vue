<template>
  <div class="vue">
    <sidebar></sidebar>
    <sidebar-customizer></sidebar-customizer>
    <cookie-warning></cookie-warning>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import SidebarCustomizer from './components/SidebarCustomizer.vue'
import CookieWarning from './components/CookieWarning.vue'

export default {
  name: 'app',
  components: {
    Sidebar,
    SidebarCustomizer,
    CookieWarning,
  }
}
</script>

<style lang="scss">

</style>
