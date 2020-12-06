export class Library {
    static tree(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('music-library-tree');
    }

    static search(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByPlaceholderText('Search your library');
    }

    static sortOrder(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.findByTestId('music-library-sort');
    }
}
