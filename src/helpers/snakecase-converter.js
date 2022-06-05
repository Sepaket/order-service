module.exports = {
  objectToSnakeCase: (payload) => {
    if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
      const result = {};
      /*
        eslint no-restricted-syntax: [
          "error",
          "FunctionExpression",
          "WithStatement",
          "BinaryExpression[operator='in']"
        ]
      */
      for (const item in payload) {
        if (payload.hasOwnProperty.call(payload, item)) {
          const convert = item.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          result[convert] = payload[item];
        }
      }
      return result;
    }

    if (typeof payload === 'string') {
      return payload.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    }

    return undefined;
  },

  arrayToSnakeCase: (payload) => {
    if (Array.isArray(payload)) {
      const arrayResult = [];
      payload.map((data) => {
        const objectResult = {};
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          /*
            eslint no-restricted-syntax: [
              "error",
              "FunctionExpression",
              "WithStatement",
              "BinaryExpression[operator='in']"
            ]
          */

          for (const item in data) {
            if (data.hasOwnProperty.call(data, item)) {
              const convert = item.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
              objectResult[convert] = data[item];
            }
          }
        }

        return arrayResult.push(objectResult);
      });

      return arrayResult.filter((item) => Object.keys(item).length > 0);
    }

    return payload;
  },
};
