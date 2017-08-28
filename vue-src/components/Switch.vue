<template>
    <label class="switch">
        <input :class="classes" type="checkbox" :checked="checked" :name="name" :disabled="disabled" v-model="value">
        <span><slot></slot></span>
    </label>
</template>

<script>
    export default {
        props: {
            disabled: Boolean,
            classes: String,
            checked: Boolean,
            name: String
        },
        data() {
            return {
                value: null
            }
        },
        beforeMount() {
            this.value = this.checked
        },
        mounted() {
            this.$emit('input', this.value)
        },
        watch: {
            value(val) {
                this.$emit('input', val)
            },
            checked (val) {
                this.value = val
            }
        }
    }
</script>

