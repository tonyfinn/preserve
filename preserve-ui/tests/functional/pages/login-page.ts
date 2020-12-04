export default {
    form(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('login-form');
    },
    serverInput(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Jellyfin Server Address');
    },
    usernameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Username');
    },
    passwordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Password');
    },
};
