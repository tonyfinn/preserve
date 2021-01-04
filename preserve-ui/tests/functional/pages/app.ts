const savedServers = [
    {
        id: '098f6bcd4621d373cade4e832627b4f6',
        name: 'Mock Server',
        address: 'http://jf-preserve.example.com',
        ty: 'jellyfin',
        userId: 'f3dc41538da2b9f2c604af06b0397e86',
        accessToken: '023d7e4fc6e0a89313cac215e3489331',
    },
];

export class App {
    static visitMocked(): void {
        cy.visit('/?mock=true&neverLoad');
    }
    static visitLoggedIn(): void {
        cy.visit('/?mock=true', {
            onBeforeLoad(window) {
                window.localStorage.setItem(
                    'preserve_mock_servers',
                    JSON.stringify(savedServers)
                );
            },
        });
    }
    static visitLoadPending(): void {
        cy.visit('/?mock=true&neverLoad', {
            onBeforeLoad(window) {
                window.localStorage.setItem(
                    'preserve_mock_servers',
                    JSON.stringify(savedServers)
                );
            },
        });
    }
    static username(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('loggedin-username');
    }
    static serverName(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('loggedin-server-name');
    }
}
