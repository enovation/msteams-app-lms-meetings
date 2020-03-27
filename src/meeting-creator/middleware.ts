import { Middleware } from 'redux';
import { CREATE_MEETING_COMMAND, MEETING_CREATED_EVENT } from './actions';
import { createMeetingService } from './service';
import { push } from 'connected-react-router';

export function createMeetingMiddleware(): Middleware {
  const service = createMeetingService();

  return store => next => action => {
    if (action.type === CREATE_MEETING_COMMAND) {
      service
        .createMeeting(action.meeting)
        .then(meeting => {
          store.dispatch({
            type: MEETING_CREATED_EVENT,
            meeting
          });
        })
        .catch(error => {
          console.error('Create meeting failed: ', error);
          store.dispatch(push('/error'));
        });
    }

    if (action.type === MEETING_CREATED_EVENT) {
      const url = new URL(document.location.href);
      let clientDomain = url.searchParams.get('url');
      if (clientDomain) {
          let returnUrl = new URL(clientDomain + '/lib/editor/atto/plugins/teamsmeeting/result.php');
          let returnUrlSearchParams = returnUrl.searchParams;
          returnUrlSearchParams.set('link', action.meeting.joinWebUrl);
          returnUrlSearchParams.set('title', action.meeting.subject);
          returnUrlSearchParams.set('preview', action.meeting.preview);
          returnUrl.search = returnUrlSearchParams.toString();
          document.location.href = returnUrl.toString();
      } else {
          store.dispatch(push("/copyMeeting"));
      }
    }
    next(action);
  };
}