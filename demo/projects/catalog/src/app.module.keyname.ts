/**
 * Keyname used by `@moduleScoped` decorators to bind services to this AppModule. Defining
 * it in its own file lets every consumer (controllers, services, commands) import it
 * without creating a circular reference back to `app.module.ts`.
 */
export const AppModuleKeyname = "catalog.app";
