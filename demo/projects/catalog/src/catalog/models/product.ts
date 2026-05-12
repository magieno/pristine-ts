/**
 * Plain product model. Not a class-validator type — this lives in the domain layer, not at
 * the HTTP boundary. Input validation happens on dedicated `*Options` classes in
 * controllers/commands; this is what flows between services.
 */
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly priceCents: number,
  ) {
  }
}
