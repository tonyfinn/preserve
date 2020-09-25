<template>
    <ul class="column-picker">
        <li v-for="column in modelValue" :key="column.title">
            <input
                :id="'column-picker-column-' + column.title"
                :checked="column.visible"
                type="checkbox"
                @change="toggleColumn(column)"
            />
            <label :for="'column-picker-column-' + column.title">{{
                column.title
            }}</label>
        </li>
    </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ColumnDef } from './types';

export default defineComponent({
    emits: ['update:modelValue'],
    props: {
        modelValue: {
            required: true,
            type: Array as PropType<Array<ColumnDef<unknown>>>,
        },
    },
    methods: {
        toggleColumn(def: ColumnDef<unknown>) {
            this.$emit('update:modelValue', [
                ...this.modelValue.map((cdef) => {
                    return {
                        title: cdef.title,
                        visible:
                            def.title === cdef.title
                                ? !cdef.visible
                                : cdef.visible,
                        renderer: cdef.renderer,
                    };
                }),
            ]);
        },
    },
});
</script>

<style lang="scss" scoped>
@import '../../styles/dims.scss';

ul {
    list-style-type: none;
}

label {
    display: inline-block;
    padding: $dims-padding-dense;
}
</style>
