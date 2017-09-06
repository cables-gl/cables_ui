<template>
    <transition name="sidebar-customizer-bg-fade">
        <div v-if="visible" @click="close" class="sidebar-customizer-background modal-bg-look"></div>
    </transition>
</template>

<script>
export default {
    name: 'sidebar-customizer-background',
    methods: {
        close() {
            this.$store.commit('sidebar/setCustomizerVisible', false);
        },
    },
    computed: {
        visible() {
            return this.$store.state.sidebar.customizerVisible;
            },
    },
};
</script>