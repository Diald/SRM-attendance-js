import axios from "axios";
import querystring from "querystring";
import base64 from "base64-js";

const url = "https://academia.srmist.edu.in/accounts/signin.ac";

const headers = {
  Origin: "https://academia.srmist.eduu.in",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36",
};

async function getToken(username, password) {
  const payload = {
    username: username,
    password: password,
    client_portal: "true",
    portal: "10002227248",
    servicename: "ZohoCreator",
    serviceurl: "https://academia.srmist.eduu.in/",
    is_ajax: "true",
    grant_type: "password",
    service_language: "en",
  };

  try {
    const response = await axios.post(url, querystring.stringify(payload), {
      headers,
    });
    const jsonData = response.data;

    if (jsonData.error) {
      const error_m = jsonData.error.msg;
      return JSON.stringify({ status: "error", msg: error_m });
    } else {
      const params = querystring.parse(jsonData.data.token_params);
      params.state = "https://academia.srmist.edu.in/";
      const authResponse = await axios.get(jsonData.data.oauthorize_uri, {
        params,
        headers,
      });
      const token = JSON.stringify(
        authResponse.request._redirectable._options.headers.cookie
      );
      const encodedToken = base64.encode(token);

      return JSON.stringify({ status: "success", token: encodedToken });
    }
  } catch (error) {
    return JSON.stringify({
      status: "error",
      msg: "An error occurred while retrieving the token",
    });
  }
}

export default getToken;
