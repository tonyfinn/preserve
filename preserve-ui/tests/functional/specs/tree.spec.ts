import App from '../pages/app';
import { Library } from '../pages/library';
import { NowPlaying } from '../pages/now-playing';
import { PlayQueue } from '../pages/play-queue';

describe('Library Tree', () => {
    it('should expand an item', () => {
        App.visitLoaded();
        Library.tree()
            .contains('Aperture Science Psychoacoustics Laboratory')
            .click();
        Library.tree().contains('Songs to Test By').click();
        Library.tree().should('contain', 'Reconstructing More Science');
    });

    it('should search tracks', () => {
        App.visitLoaded();
        Library.search().type('winter cav');
        Library.tree().should('contain', 'Angel of the Dark');
        Library.tree().should('contain', 'Endgame');
    });

    it('should add tracks to queue and play when double clicked', () => {
        App.visitLoaded();
        Library.search().type('winter cav');
        Library.tree().contains('Endgame').dblclick();

        PlayQueue.tracks().should('have.length', 1);
        const trackRow = PlayQueue.item(0);
        trackRow
            .column(0)
            .should('contain', 'Endgame (The Winter Cavalry Remix)');
        trackRow.column(1).should('contain', 'Aviators');
        trackRow.column(2).should('contain', 'Godhunter');
        NowPlaying.trackTitle().should(
            'contain',
            'Endgame (The Winter Cavalry Remix)'
        );
        NowPlaying.album().should('contain', 'Godhunter');
        NowPlaying.artist().should('contain', 'Aviators');
        NowPlaying.duration().should('contain', '07:44');
    });

    it('should add tracks to queue but not play when shift - double clicked', () => {
        App.visitLoaded();
        Library.search().type('winter cav');
        Library.tree().contains('Endgame').dblclick({
            shiftKey: true,
        });

        PlayQueue.tracks().should('have.length', 1);
        NowPlaying.trackTitle().should('not.exist');
    });

    it('should add all tracks in an album to queue and play first when dblclicked', () => {
        App.visitLoaded();
        Library.tree().contains('Introversion Software').click();
        Library.tree().contains('Darwinia Soundtrack').dblclick();
        PlayQueue.tracks().should('have.length', 6);
        PlayQueue.tracks().should('contain', 'Visitors From Dreams');
        PlayQueue.tracks().should('contain', 'Excuses');
        PlayQueue.tracks().should('contain', "Schroeder's Failure");
        PlayQueue.tracks().should('contain', 'Pain Fade Down');
        PlayQueue.tracks().should('contain', 'Impact Of Silence');
        PlayQueue.tracks().should('contain', 'Faces Of A Fashion');

        NowPlaying.trackTitle().should('contain', 'Visitors From Dreams');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Dma-Sc');
        NowPlaying.duration().should('contain', '05:30');
    });

    it('should add all tracks in an album to queue and not play when shift-dblclicked', () => {
        App.visitLoaded();
        Library.tree().contains('Introversion Software').click();
        Library.tree().contains('Darwinia Soundtrack').dblclick({
            shiftKey: true,
        });
        PlayQueue.tracks().should('have.length', 6);
        NowPlaying.trackTitle().should('not.exist');
    });

    it('should add all tracks in an artist to queue and play first when dblclicked', () => {
        App.visitLoaded();
        Library.tree().contains('The Stupendium').dblclick();
        PlayQueue.tracks().should('have.length', 18);
        PlayQueue.tracks().should('contain', 'A Very Scary Christmas');
        PlayQueue.tracks().should('contain', 'A Matter of Factories');
        PlayQueue.tracks().should(
            'contain',
            'Slide Into the Void (feat. Cami-Cat) [Acapella]'
        );
        NowPlaying.trackTitle().should('contain', 'A Very Scary Christmas');
        NowPlaying.artist().should('contain', 'The Stupendium');
        NowPlaying.album().should('contain', 'A Very Scary Christmas - Single');
    });

    it('should add all tracks in an artist to queue and not play when shift-dblclicked', () => {
        App.visitLoaded();
        Library.tree().contains('The Stupendium').dblclick({
            shiftKey: true,
        });
        PlayQueue.tracks().should('have.length', 18);
        NowPlaying.trackTitle().should('not.exist');
    });

    it('should sort by album', () => {
        App.visitLoaded();
        Library.sortOrder().select('Album');
        Library.tree().should('contain', 'Bastion Original Soundtrack');
    });
});
