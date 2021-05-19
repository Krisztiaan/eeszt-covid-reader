type ISODateString = string;
type ISODateTimeString = string; // yyyy-mm-dd
type JWTToken = string;

type ElementOf<T> = T extends (infer E)[] ? E : T;
