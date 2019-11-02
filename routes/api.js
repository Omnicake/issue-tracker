/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const expect = require("chai").expect;
const db = require("../db");

module.exports = function(app) {
  //Issue page
  app
    .route("/issues/:id")
    .get((req, res) => {
      db.Issue.findOne({ _id: Number(req.params.id) }, (err, data) => {
        err
          ? res.send(err)
          : data == null
          ? res.send("Issue not found :(")
          : process.env.NODE_ENV == "test"
          ? res.json(data)
          : res.render(process.cwd() + "/views/pug/show", { issue: data });
      });
    })
    .put((req, res) => {
      db.Issue.update(
        { _id: req.params.id },
        {
          open: req.body.status == "open" ? true : false,
          updated_on: Date.now()
        },
        (err, data) => {
          err ? res.send(err) : res.redirect("/issues/" + req.params.id);
        }
      );
    })
    .delete((req, res) => {
      db.Issue.deleteOne({ _id: req.params.id }, (err, data) => {
        err
          ? res.send(err)
          : process.env.NODE_ENV == "test"
          ? res.json({ message: "Issue succesfully deleted!" })
          : res.redirect("/");
      });
    });

  //Additional routes to handle empty id of issues
  app
    .route("/issues")
    .get((req, res) => {
      res.redirect("/");
    })
    .delete((req, res) => {
      process.env.NODE_ENV == "test"
        ? res.json({ error: "Cannot delete issue with empty id" })
        : res.redirect("/");
    });

  //Adding form
  app
    .route("/add")
    .get((req, res) => {
      res.render(process.cwd() + "/views/pug/add");
    })
    .post((req, res) => {
      let issue = new db.Issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to,
        created_on:
          req.body.created_on == undefined ? Date.now() : req.body.created_on,
        updated_on:
          req.body.updated_on == undefined ? Date.now() : req.body.updated_on,
        open: req.body.status == "open" ? true : false
      });
      issue.save((err, data) => {
        if (err) {
          if (process.env.NODE_ENV == "test") {
            res.json(err);
          } else {
            res.render(process.cwd() + "/views/pug/add", {
              errors: err.errors
            });
          }
        } else {
          if (process.env.NODE_ENV == "test") {
            res.json(data);
          } else {
            db.Issue.find({}, (err, data) => {
              err ? res.send(err) : res.redirect("/");
            });
          }
        }
      });
    });

  //Search form
  app
    .route("/search")
    .post((req, res) => {
      db.Issue.find(
        {
          $or: [
            {
              issue_title: {
                $regex: req.body.search == undefined ? "" : req.body.search,
                $options: "i"
              }
            },
            {
              issue_text: {
                $regex: req.body.search == undefined ? "" : req.body.search,
                $options: "i"
              }
            },
            {
              created_by: {
                $regex: req.body.search == undefined ? "" : req.body.search,
                $options: "i"
              }
            },
            {
              assigned_to: {
                $regex: req.body.search == undefined ? "" : req.body.search,
                $options: "i"
              }
            }
          ]
        },
        (err, data) => {
          err
            ? res.send(err)
            : process.env.NODE_ENV == "test"
            ? res.json(data)
            : res.render(process.cwd() + "/views/pug/search", {
                data: data,
                count: data.length
              });
        }
      );
    })
    .get((req, res) => {
      if (Object.entries(req.query).length === 0) {
        db.Issue.find({}, (err, data) => {
          err
            ? res.send(err)
            : process.env.NODE_ENV == "test"
            ? res.json(data)
            : res.render(process.cwd() + "/views/pug/search", { data: [] });
        });
      } else {
        let date =
          req.query.created_on == "" || req.query.created_on == undefined
            ? new Date()
            : new Date(req.query.created_on);
        let tomorrowDate = new Date(req.query.created_on);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);

        db.Issue.find(
          {
            $and: [
              {
                issue_title: {
                  $regex:
                    req.query.issue_title == null ||
                    req.query.issue_title == undefined
                      ? ""
                      : req.query.issue_title,
                  $options: "i"
                }
              },
              {
                issue_text: {
                  $regex:
                    req.query.issue_text == null ||
                    req.query.issue_text == undefined
                      ? ""
                      : req.query.issue_text,
                  $options: "i"
                }
              },
              {
                created_by: {
                  $regex:
                    req.query.created_by == null ||
                    req.query.created_by == undefined
                      ? ""
                      : req.query.created_by,
                  $options: "i"
                }
              },
              {
                assigned_to: {
                  $regex:
                    req.query.assigned_to == null ||
                    req.query.assigned_to == undefined
                      ? ""
                      : req.query.assigned_to,
                  $options: "i"
                }
              },
              {
                open:
                  req.query.status == "" || req.query.status == undefined
                    ? { $exists: true }
                    : req.query.status == "open"
                    ? true
                    : false
              },
              {
                created_on:
                  req.query.created_on == "" ||
                  req.query.created_on == undefined
                    ? { $exists: true }
                    : {
                        $gte: date.toISOString(),
                        $lte: tomorrowDate.toISOString()
                      }
              }
            ]
          },
          (err, data) =>
            err
              ? res.send(err)
              : process.env.NODE_ENV == "test"
              ? res.json(data)
              : res.render(process.cwd() + "/views/pug/search", {
                  data: data,
                  count: data.length
                })
        );
      }
    });

  //Edit form
  app
    .route("/edit/:id")
    .get((req, res) => {
      db.Issue.findOne({ _id: Number(req.params.id) }, (err, data) => {
        err
          ? res.send(err)
          : res.render(process.cwd() + "/views/pug/edit", { issue: data });
      });
    })
    .put((req, res) => {
      let updatedFields = {};
      for (let field in req.body) {
        if (req.body[field] !== "" || field == "assigned_to") {
          updatedFields[field] = req.body[field];
        }
      }
      if (Object.entries(updatedFields).length === 0) {
        if(process.env.NODE_ENV == "test") {
          res.json({ message: "No fields to update" });}
        else {
        res.redirect("/issues/" + req.params.id);
        }
      } else {
        updatedFields["updated_at"] = Date.now();
        updatedFields = { $set: updatedFields };
        db.Issue.updateOne(
          { _id: req.params.id },
          updatedFields,
          (err, data) => {
            err
              ? res.send(err)
              : db.Issue.findOne({ _id: req.params.id }, (err, data) => {
                  err
                    ? res.send(err)
                    : process.env.NODE_ENV == "test"
                    ? res.json(data)
                    : res.redirect("/issues/" + req.params.id);
                });
          }
        );
      }
    });

  //User story page
  app.route("/user-story").get((req, res) => {
    res.sendFile(process.cwd() + "/views/user-story.html");
  });

  //Index page
  app.route("/").get((req, res) => {
    db.Issue.find({}, (err, data) => {
      err
        ? res.send(err)
        : res.render(process.cwd() + "/views/pug/index", { data: data });
    });
  });
};
