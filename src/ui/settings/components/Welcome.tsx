/**welcomeMessage
 * Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
// tslint:disable-next-line: import-name
import ReleaseNotes from '../ReleaseNotes.json';
import IconButton from '../../common_components/IconButton';
import { ReduxAction } from '../../../typings/ReduxConstants';
import { resetCookieDeletedCounter } from '../../../redux/Actions';

const displayReleaseNotes = (releases: ReleaseNote[]) => {
  return (
    <div className="col">
      {releases.map((release, index) => [
        <span
          style={{
            fontWeight: 'bold',
            marginLeft: '10px',
          }}
          key={`release1${index}`}
        >
          {release.version}
        </span>,
        <ul key={`release2${index}`}>
          {release.notes.map((element, index2) => (
            <li key={`release3${index2}`}>{element}</li>
          ))}
        </ul>,
      ])}
    </div>
  );
};

// Get the review link for different browsers
const getReviewLink = (bName: browserName = browserDetect() as browserName) => {
  switch (bName) {
    case browserName.Chrome:
      return 'https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh/reviews';
    case browserName.EdgeChromium:
      return 'https://microsoftedge.microsoft.com/addons/detail/djkjpnciiommncecmdefpdllknjdmmmo#reviewList';
    case browserName.Firefox:
      return 'https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/reviews/';
    default:
      return '';
  }
};

interface OwnProps {
  style?: React.CSSProperties;
  cookieDeletedCounterSession: number;
  cookieDeletedCounterTotal: number;
  bName: browserName;
}

interface DispatchProps {
  onResetCounterButtonClick: () => void;
}

type WelcomeProps = OwnProps & DispatchProps;

const Welcome: React.FunctionComponent<WelcomeProps> = ({
  style,
  cookieDeletedCounterTotal,
  cookieDeletedCounterSession,
  bName,
  onResetCounterButtonClick,
}) => {
  const { releases } = ReleaseNotes as { releases: ReleaseNote[] };
  return (
    <div style={style}>
      <h1>{browser.i18n.getMessage('welcomeText')}</h1>

      <p>
        {browser.i18n.getMessage('welcomeMessage', [
          browser.i18n.getMessage('extensionName'),
          cookieDeletedCounterSession.toString(),
          cookieDeletedCounterTotal.toString(),
        ])}
        <IconButton
          iconName="trash"
          text={browser.i18n.getMessage('resetCookieCounterText')}
          title={browser.i18n.getMessage('resetCookieCounterText')}
          onClick={() => onResetCounterButtonClick()}
          className="btn-warning"
        />
      </p>
      <a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation">
        <span>{`${browser.i18n.getMessage('documentationText')}`}</span>
      </a>
      <br />
      <a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/FAQ:-Common-Questions-and-Issues">
        <span>{`${browser.i18n.getMessage('faqText')}`}</span>
      </a>
      <br />
      <br />
      <a href={getReviewLink(bName)}>
        {browser.i18n.getMessage(
          'reviewLinkMessage',
          browser.i18n.getMessage('extensionName'),
        )}
      </a>
      <hr />
      <h2>{browser.i18n.getMessage('releaseNotesText')}</h2>

      <div className="row">{displayReleaseNotes(releases.slice(0, 5))}</div>
      <p>
        {browser.i18n.getMessage('oldReleasesText')}{' '}
        <a
          href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/releases"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </p>
    </div>
  );
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onResetCounterButtonClick() {
    dispatch(resetCookieDeletedCounter());
  },
});

const mapStateToProps = (state: State) => {
  const {
    cookieDeletedCounterTotal,
    cookieDeletedCounterSession,
    cache,
  } = state;
  return {
    bName: cache.browserDetect || (browserDetect() as browserName),
    cookieDeletedCounterSession,
    cookieDeletedCounterTotal,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Welcome);
