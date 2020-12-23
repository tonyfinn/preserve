import { App } from '../pages/app';
import { Library } from '../pages/library';
import { NowPlaying } from '../pages/now-playing';
import { PlayQueue } from '../pages/play-queue';

describe('Player', () => {
    it('should update playback progress', () => {
        App.visitLoaded();
        Library.search().type('winter cav');
        Library.tree().contains('Endgame').dblclick();
        let initialTime = 'Missing current time';
        NowPlaying.currentTime().then(timeElement => {
            initialTime = timeElement.text();
        });
        cy.wait(2000);
        NowPlaying.currentTime().then(() => {
            NowPlaying.currentTime().should('not.equal', initialTime);
        });
    });

    it('should pause playback when pause is pressed', () => {
        App.visitLoaded();
        Library.search().type('winter cav');
        Library.tree().contains('Endgame').dblclick();
        let initialTime = 'Missing current time';
        cy.wait(2000);
        NowPlaying.pauseButton().click();
        NowPlaying.playButton().should('exist');
        NowPlaying.currentTime().then(timeElement => {
            initialTime = timeElement.text();
        });
        cy.wait(2000);
        NowPlaying.currentTime().then(() => {
            NowPlaying.currentTime().should('not.equal', initialTime);
        });
    });

    it('should play the next track when next clicked', () => {
        App.visitLoaded();
        Library.tree().contains('Introversion Software').click();
        Library.tree().contains('Darwinia Soundtrack').dblclick();

        NowPlaying.trackTitle().should('contain', 'Visitors From Dreams');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Dma-Sc');
        NowPlaying.duration().should('contain', '05:30');

        NowPlaying.nextButton().click();
        NowPlaying.trackTitle().should('contain', 'Excuses');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Trash80');
        NowPlaying.duration().should('contain', '05:46');
    });

    it('should play the previous track when next clicked', () => {
        App.visitLoaded();
        Library.tree().contains('Introversion Software').click();
        Library.tree().contains('Darwinia Soundtrack').dblclick();

        PlayQueue.tracks().eq(1).dblclick();

        NowPlaying.trackTitle().should('contain', 'Excuses');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Trash80');
        NowPlaying.duration().should('contain', '05:46');

        NowPlaying.prevButton().click();
        
        NowPlaying.trackTitle().should('contain', 'Visitors From Dreams');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Dma-Sc');
        NowPlaying.duration().should('contain', '05:30');
    });

    it('should end playback after the last track completes with no repeat on', () => {
        App.visitLoaded();
        Library.tree().contains('Introversion Software').click();
        Library.tree().contains('Darwinia Soundtrack').dblclick();

        PlayQueue.tracks().eq(5).dblclick();

        NowPlaying.trackTitle().should('contain', 'Faces Of A Fashion');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Trash80');
        NowPlaying.duration().should('contain', '04:38');

        NowPlaying.nextButton().click();

        NowPlaying.trackTitle().should('not.exist');
    });

    it('should play the first track after the last track completes with repeat on', () => {
        App.visitLoaded();
        Library.tree().contains('Introversion Software').click();
        Library.tree().contains('Darwinia Soundtrack').dblclick();

        PlayQueue.tracks().eq(5).dblclick();

        NowPlaying.trackTitle().should('contain', 'Faces Of A Fashion');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Trash80');
        NowPlaying.duration().should('contain', '04:38');

        NowPlaying.repeatButton().click();
        NowPlaying.nextButton().click();
        
        NowPlaying.trackTitle().should('contain', 'Visitors From Dreams');
        NowPlaying.album().should('contain', 'Darwinia Soundtrack');
        NowPlaying.artist().should('contain', 'Dma-Sc');
        NowPlaying.duration().should('contain', '05:30');
    });
    
    it('should cycle repeat modes and remember on reload', () => {
        App.visitLoaded();
        NowPlaying.repeatButton().click();
        NowPlaying.repeatButton().should('have.attr', 'aria-checked', 'true');
        NowPlaying.repeatButton().click();
        NowPlaying.repeatButton().should('have.attr', 'aria-checked', 'mixed');

        cy.reload();
        NowPlaying.repeatButton().click();
        NowPlaying.repeatButton().should('have.attr', 'aria-checked', 'false');
    });
    
    it('should toggle shuffle and remember on reload', () => {
        App.visitLoaded();
        NowPlaying.shuffleButton().click();
        NowPlaying.shuffleButton().should('have.attr', 'aria-checked', 'true');

        cy.reload();
        NowPlaying.shuffleButton().should('have.attr', 'aria-checked', 'true');
        NowPlaying.shuffleButton().click();
        NowPlaying.shuffleButton().should('have.attr', 'aria-checked', 'false');
    });
});
