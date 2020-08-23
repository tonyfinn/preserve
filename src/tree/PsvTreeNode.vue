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
            }"
        >
            <header
                v-if="!item.isLeaf"
                @click.exact="selectItem(item)"
                @click.ctrl.exact="appendSelection(item)"
                @click.shift.exact="extendSelection(item)"
                @dblclick="$emit('activate-item', {item})"
            >
                <h2>
                    <span class="expander" @click.stop="toggleExpand(item)">
                        <template v-if="item.expanded">V</template>
                        <template v-if="!item.expanded">&gt;</template>
                    </span>
                    {{ item.name }}
                </h2>
            </header>
            <p
                v-if="item.isLeaf"
                @click.exact="selectItem(item)"
                @click.ctrl.exact="appendSelection(item)"
                @click.shift.exact="extendSelection(item)"
                @dblclick="$emit('activate-item', {item})"
            >{{ item.name }}</p>
            <psv-tree-node
                @toggle-select-item="$emit('toggle-select-item', $event)"
                @toggle-expand-item="$emit('toggle-expand-item', $event)"
                @activate-item="$emit('activate-item', $event)"
                v-if="item.expanded && !item.isLeaf"
                :items="item.children"
            ></psv-tree-node>
        </li>
    </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { TreeItem, SelectionType } from './tree-item';

export default defineComponent({
    name: 'psv-tree-node',
    emits: ['toggle-select-item', 'toggle-expand-item', 'activate-item'],
    props: {
        items: {
            type: Array as PropType<Array<TreeItem<unknown>>>,
            required: true,
        },
    },
    computed: {
        filteredItems(): Array<TreeItem<unknown>> {
            return this.items.filter((item) => item.visible !== false);
        },
    },
    methods: {
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
                    this.$emit('toggle-expand-item', { item, expanded: true });
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
        toggleExpand(item: TreeItem<unknown>) {
            this.$emit('toggle-expand-item', {
                item,
                expanded: !item.expanded,
            });
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
    padding: $dims-padding-dense;
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
    font-size: 0.8em;
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
