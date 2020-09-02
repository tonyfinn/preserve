<template>
    <psv-tree-node
        role="tree"
        :tabindex="focusedItem ? -1 : 0"
        :items="treeItems"
        :parents="[]"
        :populateChildren="populateChildren"
        @toggle-select-item="toggleSelect($event)"
        @toggle-expand-item="toggleExpand($event)"
        @activate-item="$emit('activate-item', $event)"
        @focus-item="handleFocusItem"
        @focus="handleFocus"
        @keydown.home.stop.prevent="focusFirst"
        @keydown.end.stop.prevent="focusLast"
        @keydown.up.stop.prevent="focusPrevious"
        @keydown.down.stop.prevent="focusNext"
        @keydown.left.stop.prevent="focusExit"
        @keydown.right.stop.prevent="focusEnter"
        @keydown.enter.stop.prevent="activateFocused"
        @keydown.space.ctrl.exact.stop.prevent="appendSelectFocused"
        @keydown.space.exact.stop.prevent="replaceSelectFocused"
    ></psv-tree-node>
</template>

<script lang="ts">
import { defineComponent, PropType, nextTick } from 'vue';
import {
    TreeItem,
    SelectionType,
    TreeSelectionEvent,
    TreeExpandEvent,
    TreeItemNode,
    TreeFocusEvent,
    ChildrenLoadState,
    TreeActivateEvent,
    TreeItemEventType,
} from './tree-item';
import { PsvTreeNode } from '.';

export default defineComponent({
    components: { PsvTreeNode },
    emits: ['update-selection', 'activate-item'],
    props: {
        items: {
            type: Array as PropType<Array<TreeItem<unknown>>>,
            required: true,
        },
        populateChildren: {
            type: Function as PropType<
                (
                    node: TreeItemNode<unknown>,
                    parents: Array<TreeItem<unknown>>
                ) => Promise<Array<TreeItem<unknown>>>
            >,
        },
    },
    data() {
        return {
            treeItems: [...this.items] as Array<TreeItem<unknown>>,
            selection: new Set<TreeItem<unknown>>(),
            focusedItem: null as TreeItem<unknown> | null,
            focusIndexInParent: -1,
            focusParents: [] as Array<TreeItemNode<unknown>>,
        };
    },
    watch: {
        items() {
            this.treeItems = [...this.items] as Array<TreeItem<unknown>>;
            this.focusedItem = null;
            this.focusParents = [];
            this.focusIndexInParent = -1;
        },
    },
    methods: {
        async _populateChildren(
            node: TreeItemNode<unknown>,
            parents: Array<TreeItem<unknown>>
        ): Promise<Array<TreeItem<unknown>>> {
            if (!this.populateChildren) {
                throw new Error(
                    'Children not loaded for PsvTree and no populateChildren method defined'
                );
            }
            const children = await this.populateChildren(node, parents);
            node.childrenLoadState = ChildrenLoadState.Loaded;
            node.children = children;
            this.$forceUpdate();

            return children;
        },
        toggleExpand(evt: TreeExpandEvent<unknown>) {
            evt.item.expanded = evt.expanded;
        },
        toggleSelect(evt: TreeSelectionEvent<unknown>) {
            this._select(evt.item, evt.selectType, evt.selected);
        },
        _select(
            item: TreeItem<unknown>,
            selectType: SelectionType,
            selected: boolean
        ) {
            item.selected = selected;
            if (selected) {
                if (selectType === SelectionType.Replace) {
                    for (const selectedItem of this.selection.values()) {
                        selectedItem.selected = false;
                        this.selection.delete(selectedItem);
                    }
                }
                this.selection.add(item);
                if (!item.isLeaf) {
                    this.removeChildrenFromSelection(item);
                }
            } else {
                this.selection.delete(item);
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
        handleFocus(_evt: FocusEvent) {
            if (this.focusedItem === null && this.items.length >= 1) {
                this.focusedItem = this.items[0];
                this.focusedItem.focused = true;
                this.focusIndexInParent = 0;
                this.$el
                    .querySelector('[role=tree] > .psv-tree-node:nth-child(1)')
                    .focus();
            }
        },
        directParent(
            parents?: Array<TreeItemNode<unknown>>
        ): TreeItemNode<unknown> | null {
            if (parents && parents.length > 0) {
                return parents[parents.length - 1];
            } else {
                return null;
            }
        },
        findIndexInParent(
            item: TreeItem<unknown>,
            parents: Array<TreeItemNode<unknown>>
        ): number {
            console.log('Finding index in parent', item, parents);
            let siblings = this.itemSiblings(parents);
            for (let i = 0; i < siblings.length; i++) {
                if (siblings[i].id === item.id) {
                    return i;
                }
            }
            return -1;
        },
        itemSiblings(
            parents?: Array<TreeItemNode<unknown>>
        ): Array<TreeItem<unknown>> {
            console.log('Finding siblings', parents);
            if (parents && parents.length !== 0) {
                const lastParent = parents[parents.length - 1];
                return lastParent.children;
            } else {
                return this.items;
            }
        },
        isTreeNode(
            item?: TreeItem<unknown> | null
        ): item is TreeItemNode<unknown> {
            return item?.isLeaf === false;
        },
        hasExpandedChildren(item: TreeItemNode<unknown>): boolean {
            return item.children && item.expanded;
        },
        handleFocusItem(evt: TreeFocusEvent<unknown>) {
            console.log('Focus item event bubbled', evt);
            const index = this.findIndexInParent(evt.item, evt.parents);
            this.focusItem(evt.item, index);
            this.focusParents = evt.parents;
        },
        focusItem(item: TreeItem<unknown>, index: number) {
            console.log('Focusing item', item, index);
            if (this.focusedItem) {
                this.focusedItem.focused = false;
            }
            this.focusIndexInParent = index;
            this.focusedItem = item;
            item.focused = true;
            nextTick(() => {
                this.$el.querySelector('.psv-tree-node--focused').focus();
            });
        },
        focusParent() {
            console.log('Focusing parent');
            const parent = this.directParent(this.focusParents);
            if (!parent) {
                return;
            }
            const remainingParents = this.focusParents.slice(0, -1);
            const index = this.findIndexInParent(parent, remainingParents);
            this.focusItem(parent, index);
            this.focusParents = remainingParents;
        },
        focusFirstChild() {
            if (this.isTreeNode(this.focusedItem)) {
                this.focusParents = [...this.focusParents, this.focusedItem];
                this.focusItem(this.focusedItem.children[0], 0);
            }
        },
        focusLastOpenChild() {
            if (this.isTreeNode(this.focusedItem)) {
                const lastIndex = this.focusedItem.children.length - 1;
                if (lastIndex >= 0) {
                    const newFocus = this.focusedItem.children[lastIndex];
                    this.focusParents = [
                        ...this.focusParents,
                        this.focusedItem,
                    ];
                    this.focusItem(newFocus, lastIndex);
                    if (
                        this.isTreeNode(this.focusedItem) &&
                        this.hasExpandedChildren(this.focusedItem)
                    ) {
                        this.focusLastOpenChild();
                    }
                }
            }
        },
        focusNext(focusIn = true) {
            console.log('Focusing next');
            if (
                this.isTreeNode(this.focusedItem) &&
                this.hasExpandedChildren(this.focusedItem) &&
                focusIn
            ) {
                this.focusFirstChild();
            } else {
                let siblings = this.itemSiblings(this.focusParents);
                const newIndex = this.focusIndexInParent + 1;
                if (newIndex < siblings.length) {
                    this.focusItem(siblings[newIndex], newIndex);
                } else {
                    const parent = this.directParent(this.focusParents);
                    if (parent) {
                        this.focusParent();
                        this.focusNext(false);
                    }
                }
            }
        },
        focusPrevious() {
            let siblings = this.itemSiblings(this.focusParents);
            const newIndex = this.focusIndexInParent - 1;
            if (newIndex >= 0) {
                const newItem = siblings[newIndex];
                this.focusItem(newItem, newIndex);
                if (this.isTreeNode(newItem)) {
                    this.focusLastOpenChild();
                }
            } else if (this.focusParents && this.focusParents.length > 0) {
                this.focusParent();
            }
        },
        focusFirst() {
            if (this.items.length > 0) {
                this.focusItem(this.items[0], 0);
                this.focusParents = [];
            }
        },
        focusLast() {
            if (this.items.length > 0) {
                let lastIndex = this.items.length - 1;
                this.focusItem(this.items[lastIndex], lastIndex);
                this.focusParents = [];
                this.focusLastOpenChild();
            }
        },
        focusEnter() {
            if (
                this.isTreeNode(this.focusedItem) &&
                this.hasExpandedChildren(this.focusedItem)
            ) {
                this.focusFirstChild();
            } else if (this.isTreeNode(this.focusedItem)) {
                this.focusedItem.expanded = true;
                this._populateChildren(this.focusedItem, this.focusParents);
            }
        },
        focusExit() {
            if (this.focusedItem && !this.focusedItem.expanded) {
                this.focusParent();
            } else if (this.focusedItem?.expanded) {
                this.focusedItem.expanded = false;
            }
        },
        activateFocused(evt: KeyboardEvent) {
            if (!this.focusedItem) {
                return;
            }
            const event: TreeActivateEvent<unknown> = {
                item: this.focusedItem,
                type: TreeItemEventType.Activate,
                parents: this.focusParents,
                shiftKey: evt.shiftKey,
                ctrlKey: evt.ctrlKey,
                altKey: evt.altKey,
            };
            this.$emit('activate-item', event);
        },
        replaceSelectFocused() {
            if (!this.focusedItem) {
                return;
            }
            this._select(
                this.focusedItem,
                SelectionType.Replace,
                !this.focusedItem.selected
            );
        },
        appendSelectFocused() {
            if (!this.focusedItem) {
                return;
            }
            this._select(
                this.focusedItem,
                SelectionType.Append,
                !this.focusedItem.selected
            );
        },
    },
});
</script>
