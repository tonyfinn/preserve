import LoginPage from '../pages/login-page';
import App from '../pages/app';
import notifications from '../pages/notifications';

describe('Login', () => {
    it('should login with valid credentials', () => {
        App.visitMocked();
        LoginPage.login();
        notifications.tray().should('contain', 'Successfully logged in');
        App.username().should('have.text', 'tester');
        App.serverName().should('have.text', 'Mock Server');
    });
});
