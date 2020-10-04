<template>
    <section id="playlist" :tabindex="-1">
        <QueuePicker
            :queueManager="queueManager"
            :player="player"
        ></QueuePicker>
        <QueueTrackListing
            :library="library"
            :player="player"
            :queueManager="queueManager"
            :settings="settings"
        ></QueueTrackListing>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Library } from '../library';
import { AudioPlayer } from '../player';
import { QueueManager } from './play-queue';
import { Settings } from '../common/settings';
import QueueTrackListing from './QueueTrackListing.vue';
import QueuePicker from './QueuePicker.vue';

export default defineComponent({
    components: { QueuePicker, QueueTrackListing },
    props: {
        player: {
            type: AudioPlayer,
            required: true,
        },
        library: {
            type: Library,
            required: true,
        },
        queueManager: {
            type: QueueManager,
            required: true,
        },
        settings: {
            type: Settings,
            required: true,
        },
    },
});
</script>

<style lang="scss" scoped>
@import '../styles/dims.scss';

#playlist {
    overflow-y: scroll;
    padding: $dims-padding-dense;
    padding-top: 0;
}
</style>
