export class NowPlaying {
    static trackTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('nowplaying-track');
    }
    static album(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('nowplaying-album');
    }
    static artist(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('nowplaying-artist');
    }
    static duration(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('nowplaying-duration');
    }
    static currentTime(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('nowplaying-current-time');
    }
    static pauseButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Pause');
    }
    static playButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Play');
    }
    static prevButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Previous Track');
    }
    static nextButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Next Track');
    }
    static repeatButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('repeat-button');
    }
    static shuffleButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Shuffle');
    }
}
