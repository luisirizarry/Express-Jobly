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

function createFilterClause(q) {
  if(Object.keys(q).length === 0) {
    return { whereClause: "", values: [] };
  }
  const { name, minEmployees, maxEmployees } = q;
  // We want to convert the string to ints, if they're empty, then they're undefined and the user
  // doesnt want to sort by that
  if(name === undefined && minEmployees === undefined && maxEmployees === undefined) {
    throw new BadRequestError("If filters are provided, they at least must contain name, minEmployees or maxEmployees.");
  }
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



/**
 * @param {Object} filters - filters for the query
 * @param {string} [filters.title] - partial match for job title
 * @param {string} [filters.minSalary] - minimum salary for the job
 * @param {string} [filters.hasEquity] - if true, filter for jobs with non-zero equity
 * 
 * @returns {Object} - object with
 *   - whereClause: the SQL WHERE clause or an empty string if no filters
 *   - values: parameterized values for the query
 */

// This helper creates a WHERE clause from query filters passed in by the user.
// It first validates the provided filters, checking if they are properly formatted.
// Then, it creates the WHERE clause and pushes values into the array.

function createJobFilterClause(q) {
  if(Object.keys(q).length === 0) {
    return { whereClause: "", values: [] };
  }

  const { title, minSalary, hasEquity } = q;
  if(title === undefined && minSalary === undefined && hasEquity === undefined) {
    throw new BadRequestError("If filters are provided, they at least must contain title, minSalary or hasEquity.");
  }
  
  const minSalaryNum = minSalary ? parseInt(minSalary) : undefined;

  // check in case min salary isnt a number or its negative
  if (minSalary !== undefined && (isNaN(minSalaryNum) || minSalaryNum < 0)) {
    throw new BadRequestError("The minimum salary must be a non-negative number.");
  }

  // Now we can build the where clause
  const conditions = [];
  const values = [];

  if (title) {
    // Use the ILIKE operator from psql
    conditions.push(`title ILIKE $${conditions.length + 1}`);
    values.push(`%${title}%`); 
  }
  if (minSalaryNum !== undefined) {
    conditions.push(`salary >= $${conditions.length + 1}`);
    values.push(minSalaryNum);
  }
  // we only need to check if it's true otherwise its not included at all
  if (hasEquity === 'true') {
    conditions.push(`equity > 0`);
  }  

  // Since there already a where clause, we need to make sure they're all seperated by AND
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values };
}

module.exports = { createFilterClause, createJobFilterClause };
