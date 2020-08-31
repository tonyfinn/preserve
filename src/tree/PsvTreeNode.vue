<template>
    <ul class="psv-tree" role="group">
        <li
            role="treeitem"
            class="psv-tree-node"
            v-for="item in items"
            :key="item.id"
            :class="{
                'psv-tree-node--expanded': item.expanded,
                'psv-tree-node--collapsed': !item.expanded,
                'psv-tree-node--leaf': item.isLeaf,
                'psv-tree-node--selected': item.selected,
                'psv-tree-node--focused': item.focused,
                'psv-tree-node--children-selected': item.childrenSelected,
                [item.type]: true,
            }"
            :aria-selected="item.selected"
            :aria-expanded="ariaExpandedState(item)"
            :tabindex="item.focused ? 0 : -1"
            @focus="focusItem(item)"
        >
            <header
                v-if="!item.isLeaf"
                @mousedown.stop.exact="selectItem(item)"
                @mousedown.stop.ctrl.exact="appendSelection(item)"
                @mousedown.stop.shift.exact="extendSelection(item)"
                @dblclick.stop="activateItem(item, $event)"
            >
                <h2>
                    <span
                        class="expander"
                        @mousedown.stop="toggleExpand(item)"
                        :title="item.expanded ? 'Collapse' : 'Expand'"
                    >
                        <template v-if="item.expanded">&ndash;</template>
                        <template v-if="!item.expanded">+</template>
                    </span>
                    {{ item.name }}
                </h2>
            </header>
            <p
                v-if="item.isLeaf"
                @mousedown.stop.exact="selectItem(item)"
                @mousedown.stop.ctrl.exact="appendSelection(item)"
                @mousedown.stop.shift.exact="extendSelection(item)"
                @dblclick.stop="activateItem(item, $event)"
            >
                {{ item.name }}
            </p>
            <psv-tree-node
                @toggle-select-item="$emit('toggle-select-item', $event)"
                @toggle-expand-item="$emit('toggle-expand-item', $event)"
                @focus-item="$emit('focus-item', $event)"
                @activate-item="$emit('activate-item', $event)"
                v-if="item.expanded && childrenLoaded(item)"
                :items="item.children"
                :parents="itemParents(item)"
                :populateChildren="populateChildren"
            ></psv-tree-node>
            <p v-if="item.expanded && childrenLoading(item)">Loading...</p>
        </li>
    </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {
    TreeItem,
    SelectionType,
    ChildrenLoadState,
    TreeItemEventType,
    TreeSelectionEvent,
    TreeActivateEvent,
    TreeExpandEvent,
    TreeFocusEvent,
    TreeItemNode,
} from './tree-item';

export default defineComponent({
    name: 'psv-tree-node',
    emits: [
        'toggle-select-item',
        'toggle-expand-item',
        'activate-item',
        'focus-item',
    ],
    props: {
        items: {
            type: Array as PropType<Array<TreeItem<unknown>>>,
            required: true,
        },
        parents: {
            type: Array as PropType<Array<TreeItemNode<unknown>>>,
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
    methods: {
        childrenLoaded(item: TreeItem<unknown>) {
            return (
                !item.isLeaf &&
                item.childrenLoadState === ChildrenLoadState.Loaded
            );
        },
        childrenLoading(item: TreeItem<unknown>) {
            return (
                !item.isLeaf &&
                item.childrenLoadState === ChildrenLoadState.Loading
            );
        },
        ariaExpandedState(item: TreeItem<unknown>) {
            if (item.isLeaf) {
                return undefined;
            }
            return item.expanded;
        },
        itemParents(item: TreeItem<unknown>): Array<TreeItem<unknown>> {
            return [...this.parents, item];
        },
        focusItem(item: TreeItem<unknown>) {
            const focusEvent: TreeFocusEvent<unknown> = {
                item: item,
                type: TreeItemEventType.Focus,
                parents: this.parents,
            };
            this.$emit('focus-item', focusEvent);
        },
        selectItemInternal(item: TreeItem<unknown>, selectType: SelectionType) {
            const event: TreeSelectionEvent<unknown> = {
                item,
                type: TreeItemEventType.Selection,
                parents: this.parents,
                selectType,
                selected: !item.selected,
            };
            this.$emit('toggle-select-item', event);
            if (item.selected && !item.expanded) {
                this.toggleExpand(item);
            }

            if (item.selected) {
                const focusEvent: TreeFocusEvent<unknown> = {
                    item,
                    type: TreeItemEventType.Focus,
                    parents: this.parents,
                };
                console.log('Emitting focus event', focusEvent);
                this.$emit('focus-item', focusEvent);
            }
        },
        selectItem(item: TreeItem<unknown>) {
            this.selectItemInternal(item, SelectionType.Replace);
        },
        appendSelection(item: TreeItem<unknown>) {
            this.selectItemInternal(item, SelectionType.Append);
        },
        extendSelection(item: TreeItem<unknown>) {
            this.selectItemInternal(item, SelectionType.Extend);
        },
        activateItem(item: TreeItem<unknown>, evt: MouseEvent) {
            const event: TreeActivateEvent<unknown> = {
                item,
                parents: this.parents,
                type: TreeItemEventType.Activate,
                shiftKey: evt.shiftKey,
                ctrlKey: evt.ctrlKey,
                altKey: evt.altKey,
            };
            this.$emit('activate-item', event);
            this.selectItem(item);
        },
        toggleExpand(item: TreeItem<unknown>) {
            const expandEvent: TreeExpandEvent<unknown> = {
                item,
                parents: this.parents,
                type: TreeItemEventType.Expand,
                expanded: !item.expanded,
            };
            this.$emit('toggle-expand-item', expandEvent);
            if (
                !item.isLeaf &&
                item.childrenLoadState === ChildrenLoadState.Unloaded &&
                this.populateChildren
            ) {
                item.childrenLoadState = ChildrenLoadState.Loading;
                this.populateChildren(item, this.itemParents(item)).then(
                    (children) => {
                        item.childrenLoadState = ChildrenLoadState.Loaded;
                        item.children = children;
                        this.$forceUpdate();
                    }
                );
            }
        },
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

.psv-tree {
    list-style: none;
}

.psv-tree-node {
    width: 100%;

    .psv-tree-node {
        margin: 0 $dims-padding;
    }

    header,
    p {
        padding: $dims-padding-dense;
    }
}

.psv-tree-node--selected {
    background-color: $colors-selected;
}

.psv-tree-node--focused {
    background-color: $colors-highlight;
}

.psv-tree-node header,
.psv-tree-node--leaf {
    cursor: pointer;

    &:hover {
        background-color: $colors-highlight;
    }
}

.psv-tree-node > header .expander {
    display: inline-block;
    padding-right: 0.2em;
    font-weight: 900;
}

.psv-tree-node header h2,
.psv-tree-node header h2::before {
    display: inline-block;
    font-size: 1.2em;
}

.psv-tree-node header h2::before {
    font-size: 0.8em;
    padding-right: 0.4em;
}

.psv-tree-node:last-child {
    margin-bottom: $dims-padding;
}

.psv-tree-node > .psv-tree {
    padding-left: 1em;
}
</style>
