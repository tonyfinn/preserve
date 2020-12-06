export class LoginPage {
    static form(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('login-form');
    }
    static login(delay?: number): void {
        this.serverInput().type('http://jf-preserve.example.com', { delay });
        this.usernameInput().type('test', { delay });
        this.passwordInput().type('password', { delay });
        this.form().submit();
    }
    static serverInput(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Jellyfin Server Address');
    }
    static usernameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Username');
    }
    static passwordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Password');
    }
}
