"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "NewJob",
    salary: 120000,
    equity: 0.2,
    companyHandle: "c1",
  };

  test("works for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        ...newJob,
        equity: newJob.equity.toString(), // Ensure equity is returned as a string.
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({ title: "IncompleteJob" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({ salary: "not-a-number" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("works: no filter", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("works: with filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary: 90000, hasEquity: true });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 100000,
          equity: "0.1",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("good request with invalid filter", async function () {
    const resp = await request(app).get("/jobs").query({ something: "bad" });
    // if the filter is not valid, it should just return no jobs
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs/:companyHandle/:title */

describe("GET /jobs/:companyHandle/:title", function () {
  test("works", async function () {
    const resp = await request(app).get("/jobs/c1/Job1");
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Job1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found if no such job", async function () {
    const resp = await request(app).get("/jobs/c1/NoSuchJob");
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  const updateData = {
    title: "UpdatedJob",
    salary: 150000,
    equity: 0.3,
  };

  test("works for admin", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job1'`);
    const jobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send(updateData)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: jobId,
        ...updateData,
        companyHandle: "c1",
        equity: "0.3",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job1'`);
    const jobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send(updateData)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such job", async function () {
    const resp = await request(app)
      .patch("/jobs/99999")
      .send(updateData)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request with invalid data", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job1'`);
    const jobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({ salary: -100 })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job1'`);
    const jobId = result.rows[0].id;

    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${jobId}` });
  });

  test("unauth for non-admin", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job1'`);
    const jobId = result.rows[0].id;

    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such job", async function () {
    const resp = await request(app)
      .delete("/jobs/99999")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
