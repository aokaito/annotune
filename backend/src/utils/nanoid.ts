const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

export const nanoid = (size = 16): string => {
  let id = '';
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj?.getRandomValues) {
    const values = new Uint32Array(size);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < size; i += 1) {
      id += alphabet[values[i] % alphabet.length];
    }
    return id;
  }
  for (let i = 0; i < size; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
};
