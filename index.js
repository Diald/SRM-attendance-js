import express from "express";
import bodyParser from "body-parser";
import getToken from "./tokenSrm.js";
import getAttendenceAndMarks from "./attendance.js";
// const timetable = require("./timetable");
// const coursePersonalDetails = require("./course_personal_details");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// if successful then send this message

app.get("/", (req, res) => {
  const json_o = {
    status: "success",
    msg: "*** ACADEMIA API WITH JAVASCRIPT *** By Divya Gambhir",
  };
  res.status(200).json(json_o);
});

// starts a session token using user's email and password

app.post("/token", async (req, res) => {
  const { username, password } = req.query;

  if (!username || !password) {
    return res
      .status(400)
      .json({ status: "error", msg: "Username and password are required" });
  }

  try {
    const token = await getToken(username, password);
    res.send(token);
  } catch (error) {
    res.status(500).json({
      status: "error",
      msg: "An error occurred while retrieving the token",
    });
  }
});
// if the token session starts, it gets attendance and marks

app.post("/AttAndMarks", async (req, res) => {
  const token = req.query;
  if (token) {
    try {
      const att_marks = await getAttendenceAndMarks.getAttendenceAndMarks(
        token
      );
      res.status(200).json(att_marks);
    } catch (error) {
      res.status(500).json({
        status: "error",
        msg: "Error retrieving attendance and marks",
      });
    }
  } else {
    res.status(400).json({ status: "error", msg: "Error in Input Parameters" });
  }
});

// using the session token it gets the timetable of the user

app.post("/TimeTable", async (req, res) => {
  const { batch, token } = req.query;
  if (batch && token) {
    try {
      const timeTable = await timetable.getTimeTable(token, batch);
      res.status(200).json(timeTable);
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", msg: "Error retrieving timetable" });
    }
  } else {
    res.status(400).json({ status: "error", msg: "Error in Input Parameters" });
  }
});

// gets the personal details using the same token

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
