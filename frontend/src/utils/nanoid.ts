const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

export const nanoid = (size = 12): string => {
  let id = '';
  const cryptoObj = globalThis.crypto || undefined;
  if (cryptoObj && 'getRandomValues' in cryptoObj) {
    const randomValues = new Uint32Array(size);
    cryptoObj.getRandomValues(randomValues);
    for (let i = 0; i < size; i += 1) {
      id += alphabet[randomValues[i] % alphabet.length];
    }
    return id;
  }
  for (let i = 0; i < size; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length);
    id += alphabet[idx];
  }
  return id;
};
