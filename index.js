require("dotenv").config();

const express = require("express");
const path = require("path");
const request = require("request");
const querystring = require("querystring");
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
// const redirect_uri = "https://spotify-shuffle.herokuapp.com/callback/";
const redirect_uri = "http://alleged-man.surge.sh/"

var generateRandomString = function(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "key_state";

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "newClient")));
app.use("/", express.static(path.join(__dirname, "public")));

app.get("/login", function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  // your application requests authorization
  var scope =
    "read";
  res.redirect(
    "https://api.stocktwits.com/api/2/oauth/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      })
  );
});

app.get("/", function(req, res) {
  var code = req.query.code || null;
  res.clearCookie(stateKey);
  var authOptions = {
    url: "https://api.stocktwits.com/api/2/oauth/token",
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code"
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64")
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token,
        refresh_token = body.refresh_token;

      res.redirect(
        "/" +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          })
      );
    } else {
      res.redirect(
        "/#" +
          querystring.stringify({
            error: "invalid_token"
          })
      );
    }
  });
});


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/newClient/build/index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`STOCK APP RUNNING ON ${port}`);
