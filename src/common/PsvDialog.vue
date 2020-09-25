<template>
    <div class="dialog">
        <header>
            <slot name="header"
                ><h1>{{ title }}</h1></slot
            >
        </header>
        <div class="dialog-body">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
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
