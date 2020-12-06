export class Notification {
    constructor(readonly element: JQuery<HTMLElement>) {}

    message(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.wrap(this.element).findByTestId('notification-message');
    }

    closeButton(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.wrap(
            this.element.find('[data-testid="notification-close-button"]')
        );
    }
}

export class Notifications {
    static tray(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('notification-tray');
    }
    static all(): Notification[] {
        const notifications = [];
        const elements = this.tray().findAllByTestId('notification');
        elements.each((el) => notifications.push(new Notification(el)));
        return notifications;
    }
}
