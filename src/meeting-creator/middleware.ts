import { Middleware } from 'redux';
import { CREATE_MEETING_COMMAND, MEETING_CREATED_EVENT } from './actions';
import { createMeetingService } from './service';
import { push } from 'connected-react-router';

// Graph's joinInformation preview HTML links to this path for the "Meeting options" page.
const MEETING_OPTIONS_HREF_MARKER = 'meetingoptions';

function extractMeetingOptionsLink(previewHtml: string): string | null {
  if (!previewHtml) {
    return null;
  }
  const doc = new DOMParser().parseFromString(previewHtml, 'text/html');
  const optionsLink = Array.from(doc.querySelectorAll('a[href]')).find(link =>
    link.getAttribute('href')?.toLowerCase().includes(MEETING_OPTIONS_HREF_MARKER)
  );
  return optionsLink?.getAttribute('href') ?? null;
}

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
      let clientEditor = url.searchParams.get('editor');
      if (clientDomain) {
        let returnUrl = new URL(clientDomain + '/lib/editor/tiny/plugins/teamsmeeting/result.php');
        if (clientEditor === 'atto') {
          returnUrl = new URL(clientDomain + '/lib/editor/atto/plugins/teamsmeeting/result.php');
        }
        let returnUrlSearchParams = returnUrl.searchParams;
        returnUrlSearchParams.set('link', action.meeting.joinWebUrl);
        returnUrlSearchParams.set('title', action.meeting.subject);
        // Plugins that understand the meeting-options link opt in with previewmode=options;
        // older, un-upgraded plugins omit it and keep receiving the full preview HTML as before.
        if (url.searchParams.get('previewmode') === 'options') {
          const optionsLink = extractMeetingOptionsLink(action.meeting.preview);
          if (optionsLink) {
            returnUrlSearchParams.set('options', optionsLink);
          }
        } else {
          returnUrlSearchParams.set('preview', action.meeting.preview);
        }
        let courseId = url.searchParams.get('courseid');
        if (courseId) {
          returnUrlSearchParams.set('courseid', courseId);
        }
        let msession = url.searchParams.get('msession');
        if (msession) {
          returnUrlSearchParams.set('session', msession);
        }
        returnUrl.search = returnUrlSearchParams.toString();
        document.location.href = returnUrl.toString();
      } else {
          store.dispatch(push("/copyMeeting"));
      }
    }
    next(action);
  };
}