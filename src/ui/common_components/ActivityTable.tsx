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
import { FilterOptions } from '../../typings/Enums';

const createSummary = (cleanupObj: ActivityLog) => {
  const keys = Object.keys(cleanupObj);
  const domainSet = new Set();
  keys.forEach(key => {
    if (key !== 'dateTime' && key !== 'recentlyCleaned') {
      Object.keys(cleanupObj[key]).forEach(domain => {
        if (cleanupObj[key][domain].decision) {
          domainSet.add(domain);
        }
      });
    }
  });
  return Array.from(domainSet).join(', ');
};

interface StateProps {
  activityLog: ReadonlyArray<ActivityLog>;
  cache: CacheMap;
}

interface OwnProps {
  decisionFilter: FilterOptions;
  numberToShow?: number;
}

type ActivityTableProps = OwnProps & StateProps;

const ActivityTable: React.FunctionComponent<ActivityTableProps> = props => {
  const { activityLog, cache, numberToShow, decisionFilter } = props;
  if (props.activityLog.length === 0) {
    return (
      <div className="alert alert-primary" role="alert">
        <i>{browser.i18n.getMessage('noCleanupLogText')}</i>
      </div>
    );
  }
  const filtered = activityLog.slice(0, numberToShow || 10);
  return (
    <div
      className="accordion"
      id="accordion"
      style={{
        marginBottom: '10px',
      }}
    >
      {filtered.map((element, index) => {
        const summary = createSummary(element);
        const message = browser.i18n.getMessage('notificationContent', [
          element.recentlyCleaned.toString(),
          summary !== '' ? summary : '(Private)',
        ]);
        return (
          <div key={index} className="card">
            <div className="card-header" id={`heading${index}`}>
              <h5
                className="mb-0"
                style={{
                  overflowX: 'hidden',
                }}
              >
                <button
                  className="btn btn-link collapsed"
                  type="button"
                  data-toggle="collapse"
                  data-target={`#collapse${index}`}
                  aria-expanded="false"
                  aria-controls={`collapse${index}`}
                >
                  {`${new Date(
                    element.dateTime,
                  ).toLocaleString()} - ${message}`}
                </button>
              </h5>
            </div>
            <div
              id={`collapse${index}`}
              className="collapse"
              aria-labelledby={`heading${index}`}
              data-parent="#accordion"
            >
              <div className="card-body">
                {Object.keys(element).map(key => {
                  if (key !== 'dateTime' && key !== 'recentlyCleaned') {
                    return (
                      <div>
                        <h6>{cache[key]}</h6>
                        {Object.keys(element[key])
                          .sort((a, b) => a.localeCompare(b))
                          .filter(site => {
                            if (FilterOptions.KEEP === decisionFilter) {
                              return element[key][site].decision === false;
                            }
                            if (FilterOptions.CLEAN === decisionFilter) {
                              return element[key][site].decision === true;
                            }
                            return true;
                          })
                          .map(keyDomain => (
                            <div
                              style={{
                                marginLeft: '10px',
                              }}
                              className={`alert alert-${
                                element[key][keyDomain].decision
                                  ? 'danger'
                                  : 'success'
                              }`}
                              key={`${element.dateTime}${key}${keyDomain}`}
                              role="alert"
                            >
                              {`${keyDomain}: ${
                                element[key][keyDomain].reason
                              }`}
                            </div>
                          ))}
                      </div>
                    );
                  }
                  return '';
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const mapStateToProps = (state: State) => {
  const { activityLog, cache } = state;
  return {
    activityLog,
    cache,
  };
};

export default connect(mapStateToProps)(ActivityTable);
