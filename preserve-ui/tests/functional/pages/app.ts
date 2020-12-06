import LoginPage from './login-page';

export default {
    visitMocked(): void {
        cy.visit('/?mock=true');
    },
    visitLoaded(): void {
        this.visitMocked();
        LoginPage.login(0);
    },
    username(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('loggedin-username');
    },
    serverName(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('loggedin-server-name');
    },
};
