describe('authentication flow', () => {
  it('redirects an unauthenticated deep-link to login and preserves its destination', () => {
    cy.intercept('GET', '**/api/auth/session', {
      statusCode: 401,
      body: { error: { code: 'UNAUTHORIZED', message: 'Sesión requerida' } },
    }).as('session');

    cy.visit('/rutinas?page=2');

    cy.wait('@session');
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('contain', 'returnTo=%2Frutinas%3Fpage%3D2');
    cy.contains('Te damos la bienvenida').should('be.visible');
  });

  it('closes the server session and prevents returning to protected content', () => {
    let authenticated = true;

    cy.intercept('GET', '**/api/auth/session', request => {
      if (!authenticated) {
        request.reply({
          statusCode: 401,
          body: { error: { code: 'UNAUTHORIZED', message: 'Sesión requerida' } },
        });
        return;
      }

      request.reply({
        statusCode: 200,
        body: {
          data: {
            id: 'user-1',
            email: 'estudiante.ejemplo@pasitosmagicos.local',
            name: 'Estudiante de ejemplo',
            roles: [{ id: 'role-1', code: 'estudiante', name: 'Estudiante' }],
            permissions: [],
          },
        },
      });
    }).as('session');

    cy.intercept('POST', '**/api/auth/logout', request => {
      authenticated = false;
      request.reply({ statusCode: 204 });
    }).as('logout');

    cy.visit('/home');
    cy.contains('Hola, Evam').should('be.visible');
    cy.contains('button', 'Cerrar sesión').click();

    cy.wait('@logout');
    cy.location('pathname').should('eq', '/login');

    cy.visit('/home');
    cy.location('pathname').should('eq', '/login');
  });
});
