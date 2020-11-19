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
            <select
                id="selected-export-playlist"
                v-if="selectedDownloadType != jsonType"
                v-model="selectedExportQueue"
            >
                <option v-for="queue in queues" :key="queue.id" :value="queue">
                    {{ queue.name }}
                </option>
            </select>
            <button @click="exportPlaylist">Export</button>
        </div>
    </psv-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PsvDialog from './common/PsvDialog.vue';
import { LibraryGroupOption, GROUP_OPTIONS } from './library';
import { PlayQueue, QueueManager } from './queues';
import { Settings } from './common/settings';
import queueToXspf from './queues/xspf';
import queueToM3u from './queues/m3u';

const FILENAME_DISALLOWED_CHARACTERS = /[\\/*?<>|:?]/;

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
        queueManager: {
            type: QueueManager,
            required: true,
        },
    },
    data() {
        const queues = this.queueManager.getQueues();
        return {
            settings: this.modelValue,
            groupOptions: GROUP_OPTIONS,
            downloadTypes: DOWNLOAD_TYPE_OPTIONS,
            jsonType: DownloadType.JSON,
            queues: queues,
            selectedExportQueue: queues[0],
            selectedDownloadType: DownloadType.JSON,
        };
    },
    methods: {
        exportPlaylist() {
            switch (this.selectedDownloadType) {
                case DownloadType.JSON: {
                    const exportString = this.queueManager.queuesToExportString();
                    const playlistBlob = new Blob([exportString], {
                        type: 'application/x-preserve-playlist',
                    });
                    this.triggerDownload(
                        'preserve-playlists.json',
                        playlistBlob
                    );
                    break;
                }
                case DownloadType.XSPF: {
                    const exportString = queueToXspf(this.selectedExportQueue);
                    const playlistBlob = new Blob([exportString], {
                        type: 'application/xspf+xml',
                    });
                    this.triggerDownload(
                        `${this.exportFilename(this.selectedExportQueue)}.xspf`,
                        playlistBlob
                    );
                    break;
                }
                case DownloadType.M3U: {
                    const exportString = queueToM3u(this.selectedExportQueue);
                    const playlistBlob = new Blob([exportString], {
                        type: 'application/x-mpegurl',
                    });
                    this.triggerDownload(
                        `${this.exportFilename(this.selectedExportQueue)}.m3u8`,
                        playlistBlob
                    );
                    break;
                }
            }
        },
        exportFilename(queue: PlayQueue) {
            return queue.name.replace(FILENAME_DISALLOWED_CHARACTERS, '_');
        },
        triggerDownload(name: string, blob: Blob) {
            const anchor = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            anchor.href = objectUrl;
            anchor.download = name;
            anchor.style.display = 'none';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(objectUrl);
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
