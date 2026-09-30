import {
    RepeatMode as JfRepeatMode,
    SessionApi,
} from '@jellyfin/sdk/lib/generated-client';
import { RepeatMode } from '../../player';
import type { MediaServerReporter, PlaybackState } from '../interface';
import { JF_TICKS_PER_MS } from '../../common/constants';
import { JellyfinApiClient } from './api-client';

export class JellyfinReporter implements MediaServerReporter {
    private sessionApi: SessionApi;

    constructor(apiClient: JellyfinApiClient) {
        this.sessionApi = apiClient.session();
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
        this.sessionApi.reportPlaybackProgress({
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
        this.sessionApi.reportPlaybackStart({
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
        this.sessionApi.reportPlaybackStopped({
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
