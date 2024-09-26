const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const fse = require('fs-extra');
const dotenv = require('dotenv')

dotenv.config()

const app = express();
app.use(express.json()); // za VER06

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4010;

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/thoughts", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "thoughts.html"));
});

app.use(express.static(path.join(__dirname, "public")));

// potrebno za VER05+
const UPLOAD_PATH = path.join(__dirname, "public", "uploads");
var uploadAudio = multer({
    storage:  multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, UPLOAD_PATH);
        },
        filename: function (req, file, cb) {
            let fn = file.originalname.replaceAll(":", "-");
            cb(null, fn);
        },
    })
}).single("audio");

app.post("/saveAudio",  function (req, res) {
    uploadAudio(req, res, async function(err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                error: {
                    message: 'Upload failed: ' + JSON.stringify(err)
                }
            });
        } else {
            console.log("Saving audio!")
            console.log(req.body);
            res.json({ success: true, id: req.body.id });
            await sendPushNotifications(req.body.title);
        }
    });
});

app.get("/saved_thoughts", function (req, res) {
    let files = fse.readdirSync(UPLOAD_PATH);
    files = files.reverse().slice(0, 10);
    console.log("In", UPLOAD_PATH, "there are", files);
    res.json({
        files
    });
});

const webpush = require('web-push');
let subscriptions = [];
const SUBS_FILENAME = 'subscriptions.json';
try {
    subscriptions = JSON.parse(fs.readFileSync(SUBS_FILENAME));
} catch (error) {
    console.error(error);    
}

app.post("/saveSubscription", function(req, res) {
    console.log(req.body);
    let sub = req.body.sub;
    subscriptions.push(sub);
    fs.writeFileSync(SUBS_FILENAME, JSON.stringify(subscriptions));
    res.json({
        success: true
    });
});

async function sendPushNotifications(snapTitle) {
    webpush.setVapidDetails('mailto:borna.lindic@fer.hr', 
    'BFiL4FxF_G7pMylaAjP9Tw7NJnGecaijqQyahKKPhv7EOSjTG-dax50SjlK7_bMmtoGlqV-J6MfDPr6rXqTCaCs', 
    'ka8IWga3jNhbwqxyK-2VuC1WiCkTivNCexCt5YiWdj0');
    subscriptions.forEach(async sub => {
        try {
            console.log("Sending notif to", sub);
            await webpush.sendNotification(sub, JSON.stringify({
                title: 'New thought!',
                body: 'Somebody just shared a thought: ' + snapTitle,
                redirectUrl: '/thoughts.html'
              }));    
        } catch (error) {
            console.error(error);
        }
    });
}


if (externalUrl) {
    const hostname = '0.0.0.0';
    app.listen(port, hostname, () => {
      console.log(`Server locally running at http://${hostname}:${port}/ and from
      outside on ${externalUrl}`);}
      );
  } else {
    const hostname = '127.0.0.1';
    app.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
    });
  }
