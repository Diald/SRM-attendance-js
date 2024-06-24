import axios from "axios";
import cheerio from "cheerio";
import base64 from "base64-js";

let TimeTable = {};
let Slots = [];

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

function get_timetable(index, element) {
  const DayName = `Day-${index + 1}`;
  let timetable_eachDay = {};

  const $element = cheerio.load(element);
  $element("td:nth-child(n + 2)").each((i, value) => {
    timetable_eachDay[Slots[i]] = $element(value).text();
  });

  TimeTable[DayName] = timetable_eachDay;
}

const url = "https://academia.srmist.edu.in/liveViewHeader.do";

async function getTimeTable(token, batch) {
  batch = String(batch);

  let viewLinkName;
  if (batch === "1") {
    viewLinkName = "Common_Time_Table_Batch_1";
  } else if (batch === "2") {
    viewLinkName = "Common_Time_Table_Batch_2";
  } else {
    return JSON.stringify({ status: "error", msg: "Error in batch name." });
  }

  const Cookies = getCookieFromToken(token);
  if (Cookies === "error") {
    return JSON.stringify({ status: "error", msg: "Error in token" });
  } else {
    const headers = {
      Origin: "https://academia.srmist.edu.in",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36",
    };

    const data = {
      sharedBy: "srm_university",
      appLinkName: "academia-academic-services",
      viewLinkName: viewLinkName,
      urlParams: {},
      isPageLoad: "true",
    };

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

      dom('table[width="400"]')
        .find("tr")
        .eq(0)
        .find("td:nth-child(n + 2)")
        .each((i, value) => {
          Slots.push(cheerio.load(value).text().replace(/\t/g, ""));
        });

      dom('table[width="400"]')
        .find("tr:nth-child(n + 5)")
        .each((index, element) => {
          get_timetable(index, element);
        });

      if (Object.keys(TimeTable).length > 3) {
        return JSON.stringify({ status: "success", data: TimeTable });
      } else {
        return JSON.stringify({ status: "error", msg: "Error occurred" });
      }
    } catch (error) {
      return JSON.stringify({ status: "error", msg: "Error in request" });
    }
  }
}

// Example usage:
// getTimeTable('your_token', 1).then(console.log).catch(console.error);
