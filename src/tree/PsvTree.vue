<template>
    <psv-tree-node
        :items="items"
        @toggle-select-item="toggleSelect($event)"
        @toggle-expand-item="toggleExpand($event)"
        @activate-item="$emit('activate-item', $event.item.data)"
    ></psv-tree-node>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {
    TreeItem,
    SelectionType,
    SelectionEvent,
    ExpandEvent,
} from './tree-item';
import { PsvTreeNode } from '.';

export default defineComponent({
    components: { PsvTreeNode },
    events: ['update-selection'],
    props: {
        items: {
            type: Array as PropType<Array<TreeItem<unknown>>>,
            required: true,
        },
    },
    methods: {
        toggleExpand(evt: ExpandEvent<unknown>) {
            evt.item.expanded = evt.expanded;
        },
        toggleSelect(evt: SelectionEvent<unknown>) {
            evt.item.selected = evt.selected;
            if (evt.selected) {
                if (evt.selectType === SelectionType.Replace) {
                    for (const selectedItem of this.selection.values()) {
                        selectedItem.selected = false;
                        this.selection.delete(selectedItem);
                    }
                }
                this.selection.add(evt.item);
            } else {
                this.selection.delete(evt.item);
            }
            this.$emit('update-selection', this.selection);
        },
    },
    data() {
        return {
            selection: new Set<TreeItem<unknown>>(),
        };
    },
});
</script>