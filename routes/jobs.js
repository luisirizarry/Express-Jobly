"use strict";
/** Routes for jobs. */
const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobFilter.json");
const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/", ensureIsAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - companyHandle (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  // arrive as strings from querystring, but we want as int/bool
  if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
  q.hasEquity = q.hasEquity === "true";

  try {
    const validator = jsonschema.validate(q, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    // get query string
    const jobs = await Job.findAll(q);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[companyHandle/title]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *  
 * Authorization required: none
 */
// since anyone can search for a company, it cant use id because they woudn;t have it, makes more sense for them to have the handle and title
router.get("/:companyHandle/:title", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.title, req.params.companyHandle);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureIsAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
