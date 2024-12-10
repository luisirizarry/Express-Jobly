const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("updating data with sql query", function () {
  test("works with valid data", function () {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name", age: "age" };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("works without jsToSql mappings", function () {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = {};

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      // should just use the original keys this time
      setCols: '"firstName"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("throws error if no data provided", function () {
    const dataToUpdate = {};
    const jsToSql = { firstName: "first_name", age: "age" };

    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(BadRequestError);
  });
});
