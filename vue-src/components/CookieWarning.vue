<template>
  <div v-show="isCookieWarningVisible" class="cookie-warning">
    <p>undev.gl uses <strong>cookies</strong> to ensure that we give you the best experience on our website. If you continue we’ll assume that you are happy to receive all cookies on cables.</p>
    <div id="cookie-close-icon" class="icon icon-x" @click="close"></div>
    <!-- <div class="bluebutton" @click="close">Close</div> -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'cookie-warning',
  created: function() {
        console.log('ready');
        this.$store.dispatch('cookies/loadSettings');
        console.log('isCookieWarningVisible', this.isCookieWarningVisible);
  },
  computed: {
        isCookieWarningVisible: function() {
            return this.$store.getters['cookies/isCookieWarningVisible'];
        },
  },
  methods: {
        close: function() {
            this.$store.dispatch('cookies/accept');
        }
  }
}
</script>

<style lang="scss" src="./CookieWarning.scss"></style>
