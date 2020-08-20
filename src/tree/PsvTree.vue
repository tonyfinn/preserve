<template>
    <ul class="psv-tree">
        <li
            class="psv-tree-node"
            v-for="item in filteredItems"
            :key="item.id"
            :class="{
                'psv-tree-node-expanded': item.expanded,
                'psv-tree-node-collapsed': !item.expanded,
                'psv-tree-node-leaf': item.isLeaf,
                'psv-tree-node-selected': item.selected,
            }"
        >
            <header v-if="!item.isLeaf" @click="clickNode(item)">
                <h2>{{ item.name }}</h2>
            </header>
            <template v-if="item.isLeaf">{{ item.name }}</template>
            <psv-tree
                @toggle-select="$emit('toggle-select', $event)"
                @toggle-expand="$emit('toggle-expand', $event)"
                v-if="item.expanded && !item.isLeaf"
                :items="item.children"
            >
            </psv-tree>
        </li>
    </ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export interface TreeItem<T> {
    id: string;
    name: string;
    expanded: boolean;
    isLeaf: boolean;
    selected: boolean;
    visible: boolean;
    children?: Array<TreeItem<unknown>>;
    data: T;
}

export default defineComponent({
    name: 'psv-tree',
    emits: ['toggle-select', 'toggle-expand'],
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
        clickNode(item: TreeItem<unknown>) {
            if (!item.isLeaf) {
                this.$emit('toggle-expand', item);
            }
            this.$emit('toggle-select', item);
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

.psv-tree-node header,
.psv-tree-node-leaf {
    cursor: pointer;

    &:hover {
        background-color: lighten($colors-background, 10%);
    }
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

.psv-tree-node-collapsed > header > h2::before {
    content: '> ';
}

.psv-tree-node-expanded > header > h2::before {
    content: 'V ';
}

.psv-tree-node:last-child {
    margin-bottom: $dims-padding;
}

.psv-tree-node > .psv-tree {
    padding-left: 1em;
}
</style>
