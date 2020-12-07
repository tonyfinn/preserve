import { App } from '../pages/app';
import { Library } from '../pages/library';
import { NowPlaying } from '../pages/now-playing';
import { PlayQueue } from '../pages/play-queue';

describe('Play Queue', function () {
    describe('Track Listing', () => {
        it('should play a double clicked track', () => {
            App.visitLoaded();
            Library.search().type('winter cav');
            Library.tree().contains('Endga').dblclick({
                shiftKey: true,
            });
            Library.tree().contains('Angel of the ').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().contains('Angel of the').dblclick();
            NowPlaying.trackTitle().should('contain', 'Angel of the Dark');
            PlayQueue.activeItem().should('contain', 'Angel of the Dark');

            PlayQueue.tracks().contains('Endga').dblclick();
            NowPlaying.trackTitle().should('contain', 'Endgame');
            PlayQueue.activeItem().should('contain', 'Endgame');
        });

        it('should remove a selected track when pressing delete', () => {
            App.visitLoaded();
            Library.search().type('winter cav');
            Library.tree().contains('Endga').dblclick({
                shiftKey: true,
            });
            Library.tree().contains('Angel of the ').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().contains('Angel of the').click().type('{del}');
            PlayQueue.tracks().should('not.contain', 'Angel of the Dark');
            PlayQueue.tracks().should('have.length', 1);
        });

        it('should remember the play queue on refresh', () => {
            App.visitLoaded();
            Library.search().type('winter cav');
            Library.tree().contains('Endga').dblclick({
                shiftKey: true,
            });
            Library.tree().contains('Angel of the ').dblclick({
                shiftKey: true,
            });
            PlayQueue.tracks().should('have.length', 2);
            cy.reload();
            PlayQueue.tracks().should('have.length', 2);
            PlayQueue.tracks().should('contain', 'Endgame');
        });

        it('should remove multiple selected tracks when pressing delete', () => {
            App.visitLoaded();
            Library.search().type('winter cav');
            Library.tree().contains('Endga').dblclick({
                shiftKey: true,
            });
            Library.tree().contains('Angel of the ').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().eq(0).click();
            PlayQueue.tracks()
                .eq(1)
                .click({
                    ctrlKey: true,
                })
                .type('{del}');
            PlayQueue.tracks().should('have.length', 0);
        });

        it('should navigate focus with arrow keys when pressing delete', () => {
            App.visitLoaded();
            Library.search().type('Bastion');
            Library.tree().contains('Bastion').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks()
                .eq(0)
                .click()
                .type('{downarrow}{downarrow}{uparrow}');
            cy.focused().should('contain', 'A Proper Story');
        });

        it('should focus the first item when pressing ctrl-home', () => {
            App.visitLoaded();
            Library.search().type('Bastion');
            Library.tree().contains('Bastion').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().eq(5).click().type('{ctrl}{home}');
            cy.focused().should('contain', 'Get Used to It');
        });

        it('should focus the last item when pressing ctrl-end', () => {
            App.visitLoaded();
            Library.search().type('Bastion');
            Library.tree().contains('Bastion').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().eq(5).click().type('{ctrl}{end}');
            cy.focused().should(
                'contain',
                "The Pantheon (Ain't Gonna Catch You)"
            );
        });

        it('should select the focused item when pressing spacebar', () => {
            App.visitLoaded();
            Library.search().type('Bastion');
            Library.tree().contains('Bastion').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().eq(5).click().type('{ctrl}{end}');
            cy.focused().type(' ');
            PlayQueue.selectedItems().should('have.length', 2);
            PlayQueue.selectedItems().should(
                'contain',
                "The Pantheon (Ain't Gonna Catch You)"
            );
        });

        it('should select a range when shift-clicking', () => {
            App.visitLoaded();
            Library.tree().contains('Stupendium').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().eq(3).click();
            PlayQueue.tracks().eq(7).click({
                shiftKey: true,
            });

            PlayQueue.selectedItems().should('have.length', 5);
        });

        it('should select a single extra element when ctrl-clicking', () => {
            App.visitLoaded();
            Library.tree().contains('Stupendium').dblclick({
                shiftKey: true,
            });

            PlayQueue.tracks().eq(3).click();
            PlayQueue.tracks().eq(7).click({
                ctrlKey: true,
            });

            PlayQueue.selectedItems().should('have.length', 2);
        });
    });

    describe('Column Picker', () => {
        it('should show the default columns', () => {
            App.visitLoaded();
            PlayQueue.columnPicker().toggle().click();
            cy.findByText('Visible Columns').should('exist');
            PlayQueue.columnPicker().column('Title').should('be.checked');
            PlayQueue.columnPicker().column('Artist').should('be.checked');
            PlayQueue.columnPicker().column('Album').should('be.checked');
            PlayQueue.columnPicker().checkedColumns().should('have.length', 3);
        });

        it('should update the columns when clicked', () => {
            App.visitLoaded();
            PlayQueue.columnPicker().toggle().click();
            PlayQueue.columnPicker().column('Artist').click();
            PlayQueue.columnPicker().column('Album Artist').click();
            PlayQueue.columnPicker().column('Duration').click();
            PlayQueue.columnPicker().checkedColumns().should('have.length', 4);
            PlayQueue.columnPicker().root().findByText('Done').click();

            PlayQueue.headers().should('have.length', 4);
            PlayQueue.headers().should('contain', 'Title');
            PlayQueue.headers().should('contain', 'Album Artist');
            PlayQueue.headers().should('contain', 'Album');
            PlayQueue.headers().should('contain', 'Duration');
        });

        it('should remember the chosen columns when refreshed', () => {
            App.visitLoaded();
            PlayQueue.columnPicker().toggle().click();
            PlayQueue.columnPicker().column('Artist').click();
            PlayQueue.columnPicker().column('Album Artist').click();
            PlayQueue.columnPicker().column('Duration').click();
            PlayQueue.columnPicker().checkedColumns().should('have.length', 4);
            PlayQueue.columnPicker().root().findByText('Done').click();

            cy.reload;

            PlayQueue.headers().should('have.length', 4);
            PlayQueue.headers().should('contain', 'Title');
            PlayQueue.headers().should('contain', 'Album Artist');
            PlayQueue.headers().should('contain', 'Album');
            PlayQueue.headers().should('contain', 'Duration');
        });
    });

    describe('Queue Tabs', () => {
        it('should add a new queue', () => {
            App.visitLoaded();
            Library.search().type('Bastion');
            Library.tree().contains('Bastion').dblclick({
                shiftKey: true,
            });

            PlayQueue.newQueue()
                .dblclick()
                .findByRole('textbox')
                .type('Newly Added{enter}');
            PlayQueue.queueList().should('contain', 'Newly Added');
            PlayQueue.tracks().should('have.length', 0);
        });

        it('should switch back to an old queue', () => {
            App.visitLoaded();
            Library.search().type('Bastion');
            Library.tree().contains('Bastion').dblclick({
                shiftKey: true,
            });

            PlayQueue.newQueue()
                .dblclick()
                .findByRole('textbox')
                .clear()
                .type('Newly Added{enter}');
            PlayQueue.queueList().contains('Default').click();
            PlayQueue.tracks().should('have.length.above', 0);
        });

        it('should remember all queues', () => {
            App.visitLoaded();
            Library.search().type('Bastion');
            Library.tree().contains('Bastion').dblclick({
                shiftKey: true,
            });

            PlayQueue.newQueue()
                .dblclick()
                .findByRole('textbox')
                .clear()
                .type('Newly Added{enter}');
            Library.search().clear().type('inno');
            Library.tree().contains('Innocence Theme').dblclick({
                shiftKey: true,
            });

            cy.reload();

            PlayQueue.queueList()
                .findByRole('tab', {
                    selected: true,
                })
                .should('contain', 'Newly Added');
            PlayQueue.tracks().should('have.length', 1);

            PlayQueue.queueList().contains('Default').click();
            PlayQueue.tracks().should('have.length.above', 1);
        });
    });
});
