const webpush = require('web-push');
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

// VAPID keys should be generated only once.
// const vapidKeys = webpush.generateVAPIDKeys();

const app = express();

// Set static path
app.use(express.static(path.join(__dirname, "client")));

app.use(bodyParser.json());

webpush.setVapidDetails(
  'mailto:test@test.com',
  'BClSaUX40P-vehP9NR92FZZiMbvr-Xk4tNjq4I6nYnoGAANv_ZA6dh09dclE_umS7C-VIa5J9HhKrWDMVsWzrdI',
  '3JJSASPWd5jIpMzcSJdICI4wi_QmbkbzJodGfhBZan4'
);

// Subscribe Route
app.post("/subscribe", (req, res) => {
  // Get pushSubscription object
  const subscription = req.body;

  // Send 201 - resource created
  res.status(201).json({});

  // Create payload
  const payload = JSON.stringify({ title: "Push Test" });

  // Pass object into sendNotification
  webpush
    .sendNotification(subscription, payload)
    .catch(err => console.error(err));
});

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));