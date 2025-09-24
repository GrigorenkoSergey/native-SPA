const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charactersLength = characters.length;

const makeId = length => {
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

/**
 *
 * @param {String} prefix
 * @returns {String}
 */
export const generateIdInDocument = prefix => {
  const generate = () => (prefix ? `${prefix}-${makeId(4)}` : makeId(4));

  let result = generate();
  while (document.getElementById(result)) result = generate();

  return result;
};
