/**
 * Copyright (c) 2017 Kenny Do
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
// tslint:disable-next-line: import-name
import ReleaseNotes from '../ReleaseNotes.json';

const displayReleaseNotes = (releases: ReleaseNote[]) => {
  return (
    <div className="col-md-6">
      {releases.map((release, index) => [
        <span
          style={{
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
const getReviewLink = (browserDetect: string) => {
  if (browserDetect === 'Firefox') {
    return 'https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/reviews/';
  }
  if (browserDetect === 'Chrome') {
    return 'https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh/reviews';
  }
  return '';
};

interface OwnProps {
  style?: React.CSSProperties;
  cookieDeletedCounterSession: number;
  cookieDeletedCounterTotal: number;
  browserDetect: string;
}
const Welcome: React.FunctionComponent<OwnProps> = ({
  style,
  cookieDeletedCounterTotal,
  cookieDeletedCounterSession,
  browserDetect,
}) => {
  const { releases } = ReleaseNotes as { releases: ReleaseNote[] };
  return (
    <div style={style}>
      <h1>{browser.i18n.getMessage('welcomeText')}</h1>

      <p>
        {browser.i18n.getMessage('welcomeMessage', [
          cookieDeletedCounterSession.toString(),
          cookieDeletedCounterTotal.toString(),
        ])}
      </p>
      <a href={getReviewLink(browserDetect)}>
        {browser.i18n.getMessage('reviewLinkMessage')}
      </a>

      <h2>{browser.i18n.getMessage('releaseNotesText')}</h2>

      <div className="row">
        {displayReleaseNotes(releases.slice(0, releases.length / 2))}

        {displayReleaseNotes(
          releases.slice(releases.length / 2, releases.length),
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state: State) => {
  const {
    cookieDeletedCounterTotal,
    cookieDeletedCounterSession,
    cache,
  } = state;
  return {
    browserDetect: cache.browserDetect,
    cookieDeletedCounterSession,
    cookieDeletedCounterTotal,
  };
};

export default connect(mapStateToProps)(Welcome);
