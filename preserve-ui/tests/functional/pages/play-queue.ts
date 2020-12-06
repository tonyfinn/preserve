export class PlayQueueItem {
    constructor(readonly row: number) {}

    column(column: number): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy
            .findByTestId('play-queue-track-listing')
            .find(
                `tbody tr:nth-child(${this.row + 1}) td:nth-child(${
                    column + 1
                })`
            );
    }
}

export class PlayQueue {
    static tracks(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('play-queue-track-listing').find('tbody tr');
    }

    static item(index: number): PlayQueueItem {
        return new PlayQueueItem(index);
    }
}
