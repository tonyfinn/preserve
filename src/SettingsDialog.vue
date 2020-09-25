<template>
    <psv-dialog :title="'Settings'">
        <h1>Settings</h1>
        <h2>Default columns</h2>
        <column-picker v-model="columns"></column-picker>
    </psv-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { PLAY_QUEUE_COLUMNS } from './queues/columns';
import { ColumnPicker } from './common/table';
import PsvDialog from './common/PsvDialog.vue';

export default defineComponent({
    components: { ColumnPicker, PsvDialog },
    data() {
        return {
            columns: [...PLAY_QUEUE_COLUMNS.map((x) => Object.assign({}, x))],
        };
    },
});
</script>
