/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const db = require("../db");
const mongoose = require("mongoose");

chai.use(chaiHttp);

//should we delete the database after the test run?
let deleteAfterRun = false;

//run once before all tests
before(function(done) {
  //test if database is populated
  const Issue = db.Issue;
  Issue.countDocuments({})
    .then(function(count) {
      if (count === 0) {
        //no content so safe to delete
        deleteAfterRun = true;
      } else {
        console.log("Test database already exists");
      }
    })
    .then(function() {
      done();
    });
});

//run once after all tests
after(function(done) {
  if (deleteAfterRun) {
    console.log("Deleting test database");
    mongoose.connection.db.dropCollection("issues", db.Issue.resetCount((err, nextCount) => {
      done();
    }));
    
  } else {
    console.log(
      "Not deleting test database because it already existed before run"
    );
    done();
  }
});

suite("Functional Tests", function() {
  suite("POST /add => object with issue data", function() {
    test("Every field filled in", function(done) {
      let testDate = new Date("2019-10-31");
      testDate = testDate.toISOString();

      chai
        .request(server)
        .post("/add")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Every field filled in",
          assigned_to: "Chai and Mocha",
          created_on: testDate,
          updated_on: testDate
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title", "Issue title is wrong");
          assert.equal(res.body.issue_text, "text", "Issue text is wrong");
          assert.equal(
            res.body.created_by,
            "Functional Test - Every field filled in",
            "Wrong author of issue"
          );
          assert.equal(
            res.body.assigned_to,
            "Chai and Mocha",
            "Wrogn assignment"
          );
          assert.equal(res.body.created_on, testDate, "Creation date is wrong");
          assert.equal(res.body.updated_on, testDate, "Update date is wrong");
          done();
        });
    });

    test("Required fields filled in", function(done) {
      chai
        .request(server)
        .post("/add")
        .send({
          issue_title: "Another title",
          issue_text: "Another text",
          created_by: "Functional Test - Required fields filled in"
        })
        .end(function(err, res) {
          assert.equal(res.status, 200, "Wrong status");
          assert.equal(
            res.body.issue_title,
            "Another title",
            "Issue title is wrong"
          );
          assert.equal(
            res.body.issue_text,
            "Another text",
            "Issue text is wrong"
          );
          assert.equal(
            res.body.created_by,
            "Functional Test - Required fields filled in",
            "Author of issue is wrong"
          );
          assert.isNotOk(res.body.assigned_to, "Optional fields must ignore");
          done();
        });
    });

    test("Missing required fields", function(done) {
      chai
        .request(server)
        .post("/add")
        .send({})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isOk(res.body.errors, "Must be an error");
          done();
        });
    });
  });
});

suite("PUT /edit/{id} => text", function() {
  test("No body", function(done) {
    let issue = new db.Issue({
      issue_title: "Another title",
      issue_text: "Another text",
      created_by: "Functional Test - Required fields filled in"
    });
    issue.save((err, data) => {
      chai
        .request(server)
        .put("/edit/" + data._id)
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isOk(
            res.body.message,
            "Response must be an JSON with message about empty fields to update"
          );
          assert.equal(
            res.body.message,
            "No fields to update",
            "JSON message must be sent"
          );
          done();
        });
    });
  });

  test("One field to update", function(done) {
    let testDate = new Date("2019-10-31");
    testDate = testDate.toISOString();
    let issue = new db.Issue({
      issue_title: "Old title",
      issue_text: "Old text",
      created_by: "Functional Test - Required fields filled in",
      created_on: testDate
    });
    issue.save((err, data) => {
      chai
        .request(server)
        .put("/edit/" + data._id)
        .send({ issue_title: "New title" })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(
            res.body.issue_title,
            "New title",
            "Field must be updated"
          );
          assert.equal(
            res.body.issue_text,
            "Old text",
            "Other fields must remain same"
          );
          assert.equal(
            res.body.created_by,
            "Functional Test - Required fields filled in",
            "Other fields must remain same"
          );
          assert.notEqual(
            res.body.created_on,
            res.body.updated_on,
            "Update date must be updated"
          );
          done();
        });
    });
  });

  test("Multiple fields to update", function(done) {
    let testDate = new Date("2019-10-31");
    testDate = testDate.toISOString();
    let issue = new db.Issue({
      issue_title: "Old title",
      issue_text: "Old text",
      created_by: "Functional Test - Required fields filled in",
      created_on: testDate
    });
    issue.save((err, data) => {
      chai
        .request(server)
        .put("/edit/" + data._id)
        .send({
          issue_title: "New title",
          issue_text: "New text",
          created_by: "New author"
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(
            res.body.issue_title,
            "New title",
            "Field must be updated"
          );
          assert.equal(
            res.body.issue_text,
            "New text",
            "Field must be updated"
          );
          assert.equal(
            res.body.created_by,
            "New author",
            "Field must be updated"
          );
          assert.notEqual(
            res.body.created_on,
            res.body.updated_on,
            "Update date must be updated"
          );
          done();
        });
    });
  });
});

suite(
  "POST /search - Quick search on all fields => Array of objects with issue data",
  function() {
    test("No data", function(done) {
      chai
        .request(server)
        .post("/search")
        .send({})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], "issue_title");
          assert.property(res.body[0], "issue_text");
          assert.property(res.body[0], "created_on");
          assert.property(res.body[0], "updated_on");
          assert.property(res.body[0], "created_by");
          assert.property(res.body[0], "assigned_to");
          assert.property(res.body[0], "open");
          assert.property(res.body[0], "_id");
          done();
        });
    });

    test("With data", function(done) {
      chai
        .request(server)
        .post("/search")
        .send({ search: "title" })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body, "Must be an array of results");
          assert.isAbove(res.body.length, 0, "Must find at least 1 record");
          done();
        });
    });
  }
);

suite(
  "GET /search - Search by fields => Array of objects with issue data",
  function() {
    test("No filters", function(done) {
      chai
        .request(server)
        .get("/search")
        .query({})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body, "Must be an array of results");
          assert.isAbove(res.body.length, 0, "Must find at least 1 record");
          done();
        });
    });

    test("One filter", function(done) {
      chai
        .request(server)
        .get("/search")
        .query({ issue_title: "title" })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body, "Must be an array of results");
          assert.isAbove(res.body.length, 0, "Must find at least 1 record");
          assert.notEqual(
            res.body[0].issue_title.toLowerCase().indexOf("title"),
            -1,
            "Title must contain searched value"
          );
          done();
        });
    });

    test("Multiple filters (test for multiple fields you know will be in the db for a return)", function(done) {
      chai
        .request(server)
        .get("/search")
        .query({ issue_title: "title", issue_text: "text" })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body, "Must be an array of results");
          assert.isAbove(res.body.length, 0, "Must find at least 1 record");
          assert.notEqual(
            res.body[0].issue_title.toLowerCase().indexOf("title"),
            -1,
            "Title must contain searched value"
          );
          assert.notEqual(
            res.body[0].issue_text.toLowerCase().indexOf("text"),
            -1,
            "Text must contain searched value"
          );
          done();
        });
    });
  }
);

suite("DELETE /issues/{id} => text", function() {
  test("No _id", function(done) {
    chai
      .request(server)
      .delete("/issues/")
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isOk(
          res.body.error,
          "Response must be an JSON with message about empty id"
        );
        assert.equal(
          res.body.error,
          "Cannot delete issue with empty id",
          "JSON message with error must be sent"
        );
        done();
      });
  });

  test("Valid _id", function(done) {
    let issue = new db.Issue({
      issue_title: "Title to delete",
      issue_text: "text",
      created_by: "Functional Test - Delete with valid _id"
    });
    issue.save((err, data) => {
      chai
        .request(server)
        .delete("/issues/" + data._id)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isOk(
            res.body.message,
            "Response must be an JSON with message about empty id"
          );
          assert.equal(
            res.body.message,
            "Issue succesfully deleted!",
            "JSON message with information about successfull delete"
          );
          done();
        });
    });
  });
});
