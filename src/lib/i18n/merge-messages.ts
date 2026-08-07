type PlainObject = Record<string, unknown>;

export function mergeMessages<T extends PlainObject>(base: T, overrides: Partial<T>): T {
  const result = { ...base };

  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const override = overrides[key];
    if (override === undefined) continue;

    const baseValue = base[key];
    if (
      override &&
      typeof override === "object" &&
      !Array.isArray(override) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeMessages(
        baseValue as PlainObject,
        override as PlainObject,
      ) as T[keyof T];
      continue;
    }

    result[key] = override as T[keyof T];
  }

  return result;
}
