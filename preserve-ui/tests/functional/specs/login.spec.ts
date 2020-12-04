import LoginPage from '../pages/login-page';
import App from '../pages/app';
import notifications from '../pages/notifications';

describe('Login', () => {
    it('should login with valid credentials', () => {
        App.visitMocked();
        LoginPage.serverInput().type('http://jf-preserve.example.com');
        LoginPage.usernameInput().type('test');
        LoginPage.passwordInput().type('password');
        LoginPage.form().submit();
        notifications.tray().should('contain', 'Successfully logged in');
        App.username().should('have.text', 'tester');
        App.serverName().should('have.text', 'Mock Server');
    });
});
