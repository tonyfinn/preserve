export default {
    form(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('login-form');
    },
    login(delay?: number): void {
        this.serverInput().type('http://jf-preserve.example.com', { delay });
        this.usernameInput().type('test', { delay });
        this.passwordInput().type('password', { delay });
        this.form().submit();
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
