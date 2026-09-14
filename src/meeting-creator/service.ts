import { OnlineMeetingInput, OnlineMeeting } from './models';
import { msalApp, msalAppReady } from '../auth/msalApp';
import axios from 'axios';
import moment from 'moment';

export function createMeetingService() {
  return {
    async createMeeting(meeting: OnlineMeetingInput) {
      await msalAppReady;
      const account = msalApp.getActiveAccount() ?? msalApp.getAllAccounts()[0];

      let token;
      try {
        token = await msalApp.acquireTokenSilent({
          scopes: ['OnlineMeetings.ReadWrite'],
          account
        });
      } catch (ex) {
        token = await msalApp.acquireTokenPopup({
          scopes: ['OnlineMeetings.ReadWrite'],
          account
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

      return createdMeeting;
    }
  };
}
