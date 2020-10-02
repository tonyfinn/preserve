<template>
    <ul class="column-picker">
        <li v-for="column in modelValue" :key="column.def.field">
            <input
                :id="'column-picker-column-' + column.def.title"
                :checked="column.visible"
                type="checkbox"
                @change="toggleColumn(column)"
            />
            <label :for="'column-picker-column-' + column.def.title">{{
                column.def.title
            }}</label>
        </li>
    </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Column } from './types';

export default defineComponent({
    emits: ['update:modelValue'],
    props: {
        modelValue: {
            required: true,
            type: Array as PropType<Array<Column<unknown, unknown>>>,
        },
    },
    methods: {
        toggleColumn(toggledColumn: Column<unknown, unknown>) {
            this.$emit('update:modelValue', [
                ...this.modelValue.map((col) => {
                    return new Column(
                        col.def,
                        toggledColumn.def.field === col.def.field
                            ? !col.visible
                            : col.visible
                    );
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
