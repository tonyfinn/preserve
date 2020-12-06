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
}
