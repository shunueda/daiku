export function pick<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  const picked: Partial<T> = {}
  for (const key of keys) {
    if (key in obj) {
      picked[key] = obj[key]
    }
  }
  return picked
}
