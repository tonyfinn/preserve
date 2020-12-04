export default {
    visitMocked(): void {
        cy.visit('/?mock=true');
    },
    username(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('loggedin-username');
    },
    serverName(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('loggedin-server-name');
    },
};
