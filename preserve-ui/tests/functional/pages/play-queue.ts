export class PlayQueueItem {
    constructor(readonly row: number) {}

    column(column: number): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy
            .findByLabelText('Active Play Queue')
            .find(
                `tbody tr:nth-child(${this.row + 1}) td:nth-child(${
                    column + 1
                })`
            );
    }
}

class ColumnPicker {
    toggle(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTitle('Customise Columns');
    }
    root(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('play-queue-column-picker');
    }
    column(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
        return this.root().findByLabelText(text);
    }
    checkedColumns(): Cypress.Chainable<JQuery<HTMLElement>> {
        return this.root().findAllByRole('checkbox', {
            checked: true,
        });
    }
}

export class PlayQueue {
    static headers(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Active Play Queue').find('thead th');
    }

    static tracks(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Active Play Queue').find('tbody tr');
    }

    static activeItem(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('play-queue-active-track');
    }

    static selectedItems(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Active Play Queue').findAllByRole('row', {
            selected: true,
        });
    }

    static item(index: number): PlayQueueItem {
        return new PlayQueueItem(index);
    }

    static columnPickerToggle(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTitle('Customise Columns');
    }

    static columnPicker(): ColumnPicker {
        return new ColumnPicker();
    }

    static queueList(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByLabelText('Play Queues');
    }

    static newQueue(name?: string): Cypress.Chainable<JQuery<HTMLElement>> {
        cy.findByTitle('New Play Queue').click();
        if (name) {
            this.queueList()
                .findAllByRole('tab')
                .last()
                .dblclick()
                .findByRole('textbox')
                .clear()
                .type(`${name}{enter}`);
        }
        return this.queueList().findAllByRole('tab').last();
    }
}
