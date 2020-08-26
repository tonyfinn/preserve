<template>
    <psv-tree-node
        :items="treeItems"
        :parents="[]"
        :populateChildren="populateChildren"
        @toggle-select-item="toggleSelect($event)"
        @toggle-expand-item="toggleExpand($event)"
        @activate-item="activateItem($event)"
    ></psv-tree-node>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {
    TreeItem,
    SelectionType,
    SelectionEvent,
    ExpandEvent,
    TreeItemEvent,
    TreeItemNode,
} from './tree-item';
import { PsvTreeNode } from '.';

export default defineComponent({
    components: { PsvTreeNode },
    events: ['update-selection', 'activate-item'],
    props: {
        items: {
            type: Array as PropType<Array<TreeItem<unknown>>>,
            required: true,
        },
        populateChildren: {
            type: Function as PropType<
                (
                    node: TreeItem<unknown>,
                    parents: Array<TreeItem<unknown>>
                ) => Promise<Array<TreeItem<unknown>>>
            >,
        },
    },
    data() {
        return {
            treeItems: [...this.items] as Array<TreeItem<unknown>>,
            selection: new Set<TreeItem<unknown>>(),
        };
    },
    watch: {
        items() {
            this.treeItems = [...this.items] as Array<TreeItem<unknown>>;
        },
    },
    methods: {
        activateItem(evt: TreeItemEvent<unknown>) {
            this.$emit('activate-item', evt.item.data);
        },
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
                if (!evt.item.isLeaf) {
                    this.removeChildrenFromSelection(evt.item);
                }
            } else {
                this.selection.delete(evt.item);
            }
            this.$emit('update-selection', this.selection);
        },
        removeChildrenFromSelection(node: TreeItemNode<unknown>) {
            for (const child of node.children) {
                if (child.selected) {
                    child.selected = false;
                    this.selection.delete(child);
                }
                if (!child.isLeaf) {
                    this.removeChildrenFromSelection(child);
                }
            }
        },
    },
});
</script>
