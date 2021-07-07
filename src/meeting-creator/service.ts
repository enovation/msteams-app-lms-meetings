import { OnlineMeetingInput, OnlineMeeting } from './models';
import { msalApp } from '../auth';
import axios from 'axios';
import moment from 'moment';

export function createMeetingService() {
  return {
    async createMeeting(meeting: OnlineMeetingInput) {
      let token;
      try {
        token = await msalApp.acquireTokenSilent({
          scopes: [
              'OnlineMeetings.ReadWrite',
              'Calendars.ReadWrite'
          ]
        });
      } catch (ex) {
        token = await msalApp.acquireTokenPopup({
          scopes: [
              'OnlineMeetings.ReadWrite',
              'Calendars.ReadWrite'
          ]
        });
      }

      const requestBody = {
        startDateTime: meeting.startDateTime?.toISOString(),
        endDateTime: meeting.endDateTime?.toISOString(),
        subject: meeting.subject
      };

      const response = await axios.post(
        'https://graph.microsoft.com/beta/me/onlineMeetings',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'Content-type': 'application/json'
          }
        }
      );

      const preview = decodeURIComponent(
        (response.data.joinInformation.content?.split(',')?.[1] ?? '').replace(
          /\+/g,
          '%20'
        )
      );

      const event_data = {
          subject: meeting.subject,
          body: {
              contentType: "HTML",
              content: "Join Meeting: <br> " + response.data.joinWebUrl
          },
          start: {
              dateTime: meeting.startDateTime?.toISOString(),
              timeZone: "UTC"
          },
          end: {
              dateTime: meeting.endDateTime?.toISOString(),
              timeZone: "UTC"
          },
          isOnlineMeeting: true,
          onlineMeetingProvider: "teamsForBusiness"
      };

      const calendar_response = await axios.post(
          'https://graph.microsoft.com/beta/me/calendar/events',
          event_data,
          {
              headers: {
                  Authorization: `Bearer ${token.accessToken}`, 'Content-type': 'application/json'
              }
           }
        );
      console.log('Event Creation: ' + calendar_response.status);

      const createdMeeting = {
        id: response.data.id,
        creationDateTime: moment(response.data.creationDateTime),
        subject: response.data.subject,
        joinUrl: response.data.joinUrl,
        joinWebUrl: response.data.joinWebUrl,
        startDateTime: moment(response.data.startDateTime),
        endDateTime: moment(response.data.endDateTime),
        conferenceId: response.data.audioConferencing?.conferenceId || '',
        tollNumber: response.data.audioConferencing?.tollNumber || '',
        tollFreeNumber: response.data.audioConferencing?.tollFreeNumber || '',
        dialinUrl: response.data.audioConferencing?.dialinUrl || '',
        videoTeleconferenceId: response.data.videoTeleconferenceId,
        preview
      } as OnlineMeeting;
      console.log('Meeting Creation: ' + response.status);

      return createdMeeting;
    }
  };
}
