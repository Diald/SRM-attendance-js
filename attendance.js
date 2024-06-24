import axios from "axios";
import cheerio from "cheerio";
import base64 from "base64-js";
import qs from "qs";

let AttendanceDetails = [];

function getCookieFromToken(token) {
  try {
    token = token.replace(/\\n/g, "\n");
    const decodedToken = Buffer.from(token, "base64").toString("utf-8");
    const cookie = JSON.parse(decodedToken);
    return cookie;
  } catch (error) {
    return "error";
  }
}

function get_attendancedata(index, element) {
  if (index === 0) {
    AttendanceDetails = [];
  }
  const $element = cheerio.load(element);
  let CourseCode = $element("td").eq(0).text();

  if (CourseCode.includes("Regular")) {
    CourseCode = CourseCode.slice(0, -8);
    AttendanceDetails.push({
      CourseCode: CourseCode,
      CourseTitle: $element("td").eq(1).text(),
      Category: $element("td").eq(2).text(),
      FacultyName: $element("td").eq(3).text(),
      Slot: $element("td").eq(4).text(),
      RoomNo: $element("td").eq(5).text(),
      HoursConducted: $element("td").eq(6).text(),
      HoursAbsent: $element("td").eq(7).text(),
      Attendance: $element("td").eq(8).text(),
      UniversityPracticalDetails: $element("td").eq(9).text(),
    });
  }
}

let Marks = [];

function get_marks(index, element) {
  const $element = cheerio.load(element);
  const CourseCode = $element("td").eq(0).text();
  let Marks_each = {};
  let MarksTotal = 0;

  $element("td")
    .eq(2)
    .find("td")
    .each((i, a) => {
      const $a = cheerio.load(a);
      const testLabel = $a("strong").text();
      let testLabelAndMarks = $a(a).text();
      let testMarks = testLabelAndMarks
        .replace(testLabel, "")
        .replace(/\s/g, "");
      Marks_each[testLabel] = testMarks;

      if (testMarks !== "Abs") {
        MarksTotal += parseFloat(testMarks);
      }
    });

  Marks_each["CourseCode"] = CourseCode;
  Marks_each["Total"] = MarksTotal;

  Marks.push(Marks_each);
}

const url = "https://academia.srmist.edu.in/liveViewHeader.do";

async function getAttendenceAndMarks(token) {
  const Cookies = getCookieFromToken(token);
  if (Cookies === "error") {
    return JSON.stringify({ status: "error", msg: "Error in token" });
  } else {
    const viewLinkName = "My_Attendance";

    const headers = {
      Origin: "https://academia.srmuniv.ac.in",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36",
    };

    const data = qs.stringify({
      sharedBy: "srm_university",
      appLinkName: "academia-academic-services",
      viewLinkName: viewLinkName,
      urlParams: {},
      isPageLoad: "true",
    });

    try {
      const response = await axios.post(url, data, {
        headers: headers,
        withCredentials: true,
        cookies: Cookies,
      });
      let dom = response.data;

      const s1 = `$("#zc-viewcontainer_${viewLinkName}").prepend(pageSanitizer.sanitize(`;
      const s2 = `});</script>`;
      const a = dom.indexOf(s1);
      const b = dom.indexOf(s2);
      dom = cheerio.load(dom.slice(a + 56 + viewLinkName.length, b - 5));

      dom('table[border="1"]')
        .eq(0)
        .find("tr:nth-child(n + 2)")
        .each(get_attendancedata);
      dom('table[align="center"]')
        .eq(2)
        .find("tr:nth-child(n + 2)")
        .each(get_marks);

      const AttendanceAndMarks = AttendanceDetails.map((value_att) => {
        const value_marks = Marks.find(
          (mark) => mark.CourseCode === value_att.CourseCode
        );
        if (value_marks) {
          const req_marks = { ...value_marks };
          delete req_marks.CourseCode;
          value_att.Marks = req_marks;
        }
        return value_att;
      });

      if (AttendanceAndMarks.length > 5) {
        return JSON.stringify({ status: "success", data: AttendanceAndMarks });
      } else {
        return JSON.stringify({ status: "error", msg: "Error occurred" });
      }
    } catch (error) {
      return JSON.stringify({ status: "error", msg: "Error in request" });
    }
  }
}

export default getAttendenceAndMarks;
// Example usage:
// getAttendenceAndMarks('your_token').then(console.log).catch(console.error);
