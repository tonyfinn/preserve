<template>
    <ul class="psv-tree">
        <li
            class="psv-tree-node"
            v-for="item in filteredItems"
            :key="item.id"
            :class="{
                'psv-tree-node--expanded': item.expanded,
                'psv-tree-node--collapsed': !item.expanded,
                'psv-tree-node--leaf': item.isLeaf,
                'psv-tree-node--selected': item.selected,
                'psv-tree-node--children-selected': item.childrenSelected,
                [item.type]: true,
            }"
        >
            <header
                v-if="!item.isLeaf"
                @mousedown.stop.exact="selectItem(item)"
                @mousedown.stop.ctrl.exact="appendSelection(item)"
                @mousedown.stop.shift.exact="extendSelection(item)"
                @dblclick.stop="activateItem(item)"
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
                @dblclick.stop="activateItem(item)"
            >
                {{ item.name }}
            </p>
            <psv-tree-node
                @toggle-select-item="$emit('toggle-select-item', $event)"
                @toggle-expand-item="$emit('toggle-expand-item', $event)"
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
import { TreeItem, SelectionType, ChildrenLoadState } from './tree-item';

export default defineComponent({
    name: 'psv-tree-node',
    emits: ['toggle-select-item', 'toggle-expand-item', 'activate-item'],
    props: {
        items: {
            type: Array as PropType<Array<TreeItem<unknown>>>,
            required: true,
        },
        parents: {
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
    computed: {
        filteredItems(): Array<TreeItem<unknown>> {
            return this.items.filter((item) => item.visible !== false);
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
        itemParents(item: TreeItem<unknown>): Array<TreeItem<unknown>> {
            return [...this.parents, item];
        },
        selectItemInternal(item: TreeItem<unknown>, selectType: SelectionType) {
            if (item.selected) {
                this.$emit('toggle-select-item', {
                    item,
                    selectType,
                    selected: false,
                });
            } else {
                this.$emit('toggle-select-item', {
                    item,
                    selectType,
                    selected: true,
                });
                if (!item.expanded) {
                    this.toggleExpand(item);
                }
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
        activateItem(item: TreeItem<unknown>) {
            this.$emit('activate-item', { item });
            this.selectItem(item);
        },
        toggleExpand(item: TreeItem<unknown>) {
            this.$emit('toggle-expand-item', {
                item,
                expanded: !item.expanded,
            });
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

    header,
    p {
        padding: $dims-padding-dense;
    }
}

.psv-tree-node--selected {
    background-color: $colors-selected;
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
