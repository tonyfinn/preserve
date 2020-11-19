<template>
    <psv-dialog :title="'Settings'" @close-dialog="$emit('close-settings')">
        <h2>Tree Layout</h2>
        <select v-model="settings.libraryGrouping">
            <option
                v-for="groupOption in groupOptions"
                :key="groupOption.value"
                :value="groupOption.value"
            >
                {{ groupOption.label }}
            </option>
        </select>
        <h2>Download Playlists</h2>
        <div class="download-type">
            <label class="sr-only" for="selected-download-type">Format: </label>
            <select id="selected-download-type" v-model="selectedDownloadType">
                <option
                    v-for="downloadType in downloadTypes"
                    :key="downloadType.value"
                    :value="downloadType.value"
                >
                    {{ downloadType.label }}
                </option>
            </select>
            <button @click="doDownload">Export</button>
        </div>
    </psv-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PsvDialog from './common/PsvDialog.vue';
import { LibraryGroupOption, GROUP_OPTIONS } from './library';
import { Settings } from './common/settings';

enum DownloadType {
    JSON,
    M3U,
    XSPF,
}

const DOWNLOAD_TYPE_OPTIONS = [
    { value: DownloadType.JSON, label: 'Preserve' },
    { value: DownloadType.M3U, label: 'm3u' },
    { value: DownloadType.XSPF, label: 'xspf' },
];

export default defineComponent({
    components: { PsvDialog },
    emits: ['close-settings', 'update:modelValue'],
    props: {
        modelValue: {
            type: Settings,
            required: true,
        },
    },
    data() {
        return {
            settings: this.modelValue,
            groupOptions: GROUP_OPTIONS,
            downloadTypes: DOWNLOAD_TYPE_OPTIONS,
            selectedDownloadType: DownloadType.JSON,
        };
    },
    methods: {
        doDownload() {
            alert('Export not yet implemented');
        },
    },
    watch: {
        modelValue: {
            handler(newSettings: Settings) {
                this.settings = newSettings;
            },
            deep: true,
        },
        settings: {
            handler(newValue: Settings) {
                this.$emit('update:modelValue', newValue);
            },
            deep: true,
        },
    },
    computed: {
        selectedLibraryGrouping(): LibraryGroupOption {
            return this.settings.libraryGrouping;
        },
    },
});
</script>

<style lang="scss" scoped>
@import 'styles/dims.scss';

.download-type {
    display: grid;
    grid-auto-flow: column;
    justify-content: start;
    align-content: center;
    grid-gap: $dims-padding;

    button {
        margin-right: 1em;
    }
}
</style>
