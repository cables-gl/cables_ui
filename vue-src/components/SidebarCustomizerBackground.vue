<template>
    <transition name="sidebar-customizer-bg-fade">
        <div v-if="visible" class="sidebar-customizer-background"></div>
    </transition>
</template>

<script>
export default {
    name: 'sidebar-customizer-background',
    computed: {
        visible() {
            return this.$store.state.sidebar.customizerVisible;
            },
    },
};
</script>