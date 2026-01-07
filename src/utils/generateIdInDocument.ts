const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charactersLength = characters.length;

const makeId = (length: number) => {
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const generateIdInDocument = (prefix: string) => {
  const generate = () => (prefix ? `${prefix}-${makeId(4)}` : makeId(4));

  let result = generate();
  while (document.getElementById(result)) result = generate();

  return result;
};
