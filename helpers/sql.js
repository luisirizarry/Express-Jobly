const { BadRequestError } = require("../expressError");

/**
 * 
 * @param {*} dataToUpdate - data to update, where keys are column names or their js equivalents
 *                           Ex: { firstName: "Aliya", age: 32 }
 * 
 * @param {*} jsToSql - mapping of js like keys to db column names
 *                      Ex: { firstName: "first_name", age: "age" }
 * 
 * @returns - `setCols` a sql SET with the parameterized placeholders
 *             Ex: '"first_name"=$1, "age"=$2'
 *          - `values` an array of values corresponding to the placeholders in `setCols`
 *             Ex: ['Aliya', 32]
 */

// The general function for this helper is to take the keys from the object
// and convert them into a sanizted query string that will be used in our update statements 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Get an array of keys from the dataToUpdate
  const keys = Object.keys(dataToUpdate);
  // If theres no keys, then there's no data, so throw an error
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // The example shows how we go from an js object and use its keys to create a sanitized query

  // For the keys array, map the column name and its index,
  // However, if the colName already exists in the jsToSql object, use it
  // otherwise use the colName in the keys array 
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    // for the setCols property, you take the columns and join them
    // just like the example '"first_name"=$1', '"age"=$2'
    setCols: cols.join(", "),
    // For the values property, its just an array with the values of the dataToUpdate object
    // These values should later be connected to what colum they line up with when making the sanatized query later on
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
