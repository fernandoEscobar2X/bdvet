// Igualdad estructural exacta de tipos en tiempo de compilación.
export type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Guarda de no-divergencia: `Expect<Equals<...>>` falla la compilación si el
// schema Zod y la entidad de dominio dejan de coincidir.
export type Expect<T extends true> = T;
