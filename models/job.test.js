"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "NewJob",
    salary: 120000,
    equity: 0.2,
    companyHandle: "c1",
  };

  test("works", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "NewJob",
      salary: 120000,
      equity: "0.2",
      companyHandle: "c1",
    });

    const result = await db.query(`
      SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE title = 'NewJob'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "NewJob",
        salary: 120000,
        equity: "0.2",
        companyHandle: "c1",
      },
    ]);
  });

  test("bad request with duplicate", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Job1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job2",
        salary: 80000,
        equity: "0.05",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Job3",
        salary: 60000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: with filter", async function () {
    const jobs = await Job.findAll({ minSalary: 90000, hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Job1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
    ]);
  });
  test("works: with filter but no jobs are expected", async function () {
    const jobs = await Job.findAll({ minSalary: 110000, hasEquity: true });
    expect(jobs).toEqual([]);
  });

  test("bad request with invalid filter", async function () {
    try {
      await Job.findAll({ notAFilter: "90000" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError);
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const job = await Job.get("Job1", "c1");
    expect(job).toEqual({
      id: expect.any(Number),
      title: "Job1",
      salary: 100000,
      equity: "0.1",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("Nope", "c1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "UpdatedJob",
    salary: 150000,
    equity: 0.3,
  };

  test("works", async function () {
    const job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "UpdatedJob",
      salary: 150000,
      equity: "0.3",
      companyHandle: "c1",
    });

    const result = await db.query(`
      SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id = 1`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "UpdatedJob",
        salary: 150000,
        equity: "0.3",
        companyHandle: "c1",
      },
    ]);
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(`
      SELECT id FROM jobs WHERE id = 1`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(99999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
