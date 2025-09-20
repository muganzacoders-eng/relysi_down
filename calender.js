const { google } = require('googleapis');

// Authenticate using your service account
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,           // e.g., calendar-service@myappauth-469119.iam.gserviceaccount.com
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// Set the calendar ID (the one you shared the service account with)
const calendarId = 'pauldeogratias12@gmail.com';

// Example: create a simple event
async function createEvent() {
  try {
    const event = {
      summary: 'Test Event',
      description: 'Event created via service account',
      start: { dateTime: '2025-08-28T10:00:00+03:00' },
      end: { dateTime: '2025-08-28T11:00:00+03:00' },
    };

    const response = await calendar.events.insert({
      calendarId,
      resource: event,
    });

    console.log('Event created:', response.data.htmlLink);
  } catch (err) {
    console.error('Error creating event:', err);
  }
}

createEvent();
