const express = require('express');
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = '129690161184-uoi4kikpd6i9vkms3ngmm01bs112m2ns.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://backend-assignment-b2hd.onrender.com/rest/v1/calendar/redirect/';
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

app.set('view engine', 'ejs');

app.get('/', async (req, res, next) => {
  res.render("temp");
});

app.use('/api', require('./routes/api.route'));

// Step 1: Initialize Google Calendar OAuth
app.get('/rest/v1/calendar/init', (req, res) => {
  const authUrl = generateAuthUrl();
  res.redirect(authUrl);
});

// Step 2: Handle redirect and get access_token
app.get('/rest/v1/calendar/redirect', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await exchangeCodeForTokens(code);
    const accessToken = tokens.access_token
    const events = await getEvents(tokens.access_token);
    console.log(events,tokens)
    res.render("test",{events,accessToken})
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Error retrieving events from Google Calendar.');
  }
});

// Generate the authorization URL
function generateAuthUrl() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  return authUrl;
}

// Exchange authorization code for tokens
function exchangeCodeForTokens(code) {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  return oauth2Client.getToken(code);
}

// Get a list of events from the user's calendar
async function getEvents(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const response = await calendar.events.list({
    calendarId: 'primary', // 'primary' refers to the user's primary calendar
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
