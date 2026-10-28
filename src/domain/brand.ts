/** Nominal typing helper: keeps IDs of different kinds from being mixed up. */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };
