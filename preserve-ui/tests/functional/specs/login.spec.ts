import { LoginPage } from '../pages/login-page';
import { App } from '../pages/app';
import { Notifications } from '../pages/notifications';

const legacySavedServers = {
    Servers: [
        {
            RemoteAddress: 'http://jf-preserve.example.com',
            Name: 'Mock Server',
            Id: '098f6bcd4621d373cade4e832627b4f6',
            LastConnectionMode: 0,
            DateLastAccessed: 1606869105875,
            UserId: 'f3dc41538da2b9f2c604af06b0397e86',
            AccessToken: '023d7e4fc6e0a89313cac215e3489331',
            LocalAddress: 'http://192.168.1.1:8096',
            ExchangeToken: null,
        },
    ],
};

describe('Login', () => {
    it('should login with valid credentials', () => {
        App.visitMocked();
        LoginPage.login();
        Notifications.tray().should('contain', 'Successfully logged in');
        App.username().should('have.text', 'tester');
        App.serverName().should('have.text', 'Mock Server');
    });

    it('should skip login if has credentials', () => {
        App.visitLoaded();
        LoginPage.form().should('not.exist');
        Notifications.tray().should('contain', 'Reconnected to Mock Server');
    });

    it('should skip login if has legacy credentials', () => {
        cy.visit('/?mock=true', {
            onBeforeLoad(window) {
                window.localStorage.setItem(
                    'preserve_mock_auth',
                    JSON.stringify(legacySavedServers)
                );
            },
        });
        LoginPage.form().should('not.exist');
        Notifications.tray().should('contain', 'Reconnected to Mock Server');
    });

    it('should trigger login if has expired credentials', () => {
        cy.visit('/?mock=true', {
            onBeforeLoad(window) {
                const savedServers = JSON.parse(
                    JSON.stringify(legacySavedServers)
                ); // deep clone
                savedServers.Servers[0].AccessToken = 'asdasd';
                window.localStorage.setItem(
                    'preserve_mock_auth',
                    JSON.stringify(savedServers)
                );
            },
        });
        LoginPage.form().should('exist');
        Notifications.tray().should('contain', 'please login again');
    });
});
