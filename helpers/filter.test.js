const { createFilterClause } = require("./filter");
const { BadRequestError } = require("../expressError");

describe("updating data with sql query", function () {
  test("creates a WHERE clause with all filters", function () {
    const result = createFilterClause({
      name: "net",
      minEmployees: "10",
      maxEmployees: "50",
    });
    expect(result).toEqual({
      whereClause:"WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3",
      values: ["%net%", 10, 50],
    });
  });
  
  test("throws error when minEmployees is greater than maxEmployees", function () {
    expect(() => createFilterClause({ minEmployees: "50", maxEmployees: "10" })).toThrow(BadRequestError);
  });
});
