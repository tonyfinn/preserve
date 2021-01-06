import {
    PlaystateApi,
    RepeatMode as JfRepeatMode,
} from '@jellyfin/client-axios';
import { RepeatMode } from 'preserve-ui/src/player';
import { MediaServerReporter, PlaybackState } from '../interface';
import { JF_TICKS_PER_MS } from 'preserve-ui/src/common/constants';
import { JellyfinApiClient } from './api-client';

export class JellyfinReporter implements MediaServerReporter {
    private playstateApi: PlaystateApi;

    constructor(apiClient: JellyfinApiClient) {
        this.playstateApi = apiClient.playstate();
    }

    private mapRepeatMode(repeatMode: RepeatMode): JfRepeatMode {
        if (repeatMode === RepeatMode.RepeatOne) {
            return JfRepeatMode.RepeatOne;
        } else if (repeatMode === RepeatMode.Repeat) {
            return JfRepeatMode.RepeatAll;
        } else {
            return JfRepeatMode.RepeatNone;
        }
    }

    private reportProgressInternal(playback: PlaybackState): void {
        if (!playback.trackId) {
            return;
        }
        this.playstateApi.reportPlaybackProgress({
            playbackProgressInfo: {
                ItemId: playback.trackId,
                RepeatMode: this.mapRepeatMode(playback.repeatMode),
                PositionTicks: Math.floor(
                    playback.progressMs * JF_TICKS_PER_MS
                ),
                PlaySessionId: playback.startTime.getTime().toString(),
                IsMuted: playback.muted,
                IsPaused: playback.paused,
                VolumeLevel: Math.round(playback.volume * 100),
            },
        });
    }

    trackStarted(playback: PlaybackState): void {
        if (!playback.trackId) {
            console.error(
                'Tried to report playback of track with null id',
                playback
            );
            return;
        }
        this.playstateApi.reportPlaybackStart({
            playbackStartInfo: {
                ItemId: playback.trackId,
                RepeatMode: this.mapRepeatMode(playback.repeatMode),
                PositionTicks: Math.floor(
                    playback.progressMs * JF_TICKS_PER_MS
                ),
                PlaySessionId: playback.startTime.getTime().toString(),
                IsMuted: playback.muted,
                IsPaused: playback.paused,
                VolumeLevel: Math.round(playback.volume * 100),
            },
        });
    }
    trackProgress(playback: PlaybackState): void {
        if (!playback.trackId) {
            console.error(
                'Tried to report playback progress of track with null id',
                playback
            );
            return;
        }
        this.reportProgressInternal(playback);
    }
    trackFinished(playback: PlaybackState): void {
        if (!playback.trackId) {
            console.error(
                'Tried to report playback completion of track with null id',
                playback
            );
            return;
        }
        this.playstateApi.reportPlaybackStopped({
            playbackStopInfo: {
                ItemId: playback.trackId,
                PositionTicks: Math.floor(
                    playback.progressMs * JF_TICKS_PER_MS
                ),
                PlaySessionId: playback.startTime.getTime().toString(),
            },
        });
    }
    shuffleModeChanged(_playback: PlaybackState): void {
        return; // Jellyfin does not care about shuffle mode
    }
    repeatModeChanged(playback: PlaybackState): void {
        this.reportProgressInternal(playback);
    }
    paused(playback: PlaybackState): void {
        this.reportProgressInternal(playback);
    }
    resumed(playback: PlaybackState): void {
        this.reportProgressInternal(playback);
    }
    volumeChanged(playback: PlaybackState): void {
        this.reportProgressInternal(playback);
    }
    mutedToggled(playback: PlaybackState): void {
        this.reportProgressInternal(playback);
    }
}
