const { BadRequestError } = require("../expressError");

/**
 * @param {Object} filters - filters for the query
 * @param {string} [filters.name] - partial match for company name
 * @param {string} [filters.minEmployees] - min number of employees
 * @param {string} [filters.maxEmployees] - max number of employees
 * 
 * @returns {Object} - object with
 *   - whereClause the SQL WHERE clause or an empty string if no filters
 *   - values parameterized values for the query
 */

// this helper creates a WHERE clause from sort queries that the use passes in
// First checked if the queries were valid
// Then create the WHERE clause based on the conditions passed in, and push in the values as well
// It kind of gets some of the concepts from the sqlForPartialUpdate helper 

function createFilterClause({ name, minEmployees, maxEmployees }) {
  // We want to convert the string to ints, if they're empty, then they're undefined and the user
  // doesnt want to sort by that
  const minEmployeesNum = minEmployees ? parseInt(minEmployees) : undefined;
  const maxEmployeesNum = maxEmployees ? parseInt(maxEmployees) : undefined;

  // However if they exist we need to check if they're valid numbers, otherwise we cant sort
  if (minEmployees && isNaN(minEmployeesNum)) {
    throw new BadRequestError("minEmployees must be a valid number");
  }

  if (maxEmployees && isNaN(maxEmployeesNum)) {
    throw new BadRequestError("maxEmployees must be a valid number");
  }

  // This final check makes sure even if both queries exist, min employees shouldnt be greater than max employees
  if (minEmployeesNum !== undefined && maxEmployeesNum !== undefined && minEmployeesNum > maxEmployeesNum) {
    throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
  }

  // Now we can build the where clause
  const conditions = [];
  const values = [];

  if (name) {
    // Use the ILIKE operator from psql
    conditions.push(`name ILIKE $${conditions.length + 1}`);
    values.push(`%${name}%`); 
  }
  if (minEmployeesNum !== undefined) {
    conditions.push(`num_employees >= $${conditions.length + 1}`);
    values.push(minEmployeesNum);
  }
  if (maxEmployeesNum !== undefined) {
    conditions.push(`num_employees <= $${conditions.length + 1}`);
    values.push(maxEmployeesNum);
  }

  // Since there already a where clause, we need to make sure they're all seperated by AND
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values };
}

module.exports = { createFilterClause };
