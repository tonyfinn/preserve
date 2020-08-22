<template>
    <section id="playlist">
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Album Artist</th>
                    <th>Album</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="track in tracks" :key="track.id">
                    <td>{{ track.title }}</td>
                    <td>{{ track.artist }}</td>
                    <td>{{ track.album }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Track } from './library/library';

export default defineComponent({
    data() {
        return {
            tracks: [] as Array<Track>,
        };
    },
    method: {
        addTrack(item: Track) {
            this.tracks.push(item);
        },
    },
});
</script>

<style lang="scss">
@import './styles/colors.scss';
@import './styles/dims.scss';

#playlist {
    padding: $dims-padding;
}

#playlist table {
    width: 100%;
    padding: 1em;
    border-collapse: collapse;
}

#playlist table th {
    border-bottom: 1px solid white;
    text-align: left;
}

#playlist table td {
    padding: $dims-padding-dense;
    border: 0;
}

#playlist table tr:nth-child(even) {
    background: $colors-background-alt;
}
</style>
