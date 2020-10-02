<template>
    <teleport to="#dialog-container">
        <div class="dialog">
            <header>
                <slot name="header"
                    ><h1>{{ title }}</h1>
                    <i
                        v-if="closable"
                        class="fi-x close-icon"
                        title="Close Settings"
                        @click="$emit('close-dialog')"
                    ></i
                ></slot>
            </header>
            <div class="dialog-body">
                <slot></slot>
            </div>
        </div>
    </teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    emits: ['close-dialog'],
    props: {
        title: {
            type: String,
            required: true,
        },
        closable: {
            type: Boolean,
            default: true,
        },
    },
});
</script>

<style lang="scss" scoped>
@import '../styles/colors.scss';
@import '../styles/dims.scss';
.dialog {
    margin: 1em auto;
    max-width: 60em;
    padding: $dims-padding;
    border-radius: $dims-border-radius;
    background-color: $colors-background;
    border: 2px solid $colors-primary;
    pointer-events: auto;

    & > header {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: 1fr auto;
    }
}

.close-icon {
    cursor: pointer;
}
</style>
