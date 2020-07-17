/**
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
import { clearActivities } from '../../../redux/Actions';
import { FilterOptions } from '../../../typings/Enums';
import { ReduxAction } from '../../../typings/ReduxConstants';
import ActivityTable from '../../common_components/ActivityTable';
import IconButton from '../../common_components/IconButton';

interface OwnProps {
  style?: React.CSSProperties;
}

interface DispatchProps {
  onClearActivityLogClick: () => void;
}

type ActivityLogProps = OwnProps & DispatchProps;

class ActivityLog extends React.Component<ActivityLogProps> {
  public state = {
    decisionFilter: FilterOptions.NONE,
  };

  public setNewFilter(filter: FilterOptions) {
    this.setState({
      decisionFilter: filter,
    });
  }

  public render() {
    const { style, onClearActivityLogClick } = this.props;
    // const { decisionFilter } = this.state;
    return (
      <div style={style}>
        <h1>{browser.i18n.getMessage('cleanupLogText')}</h1>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              marginTop: '5px',
            }}
          >
            {/* <span>{`${browser.i18n.getMessage('filterText')}: `}</span>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="filterRadios"
                id="filterRadios1"
                value="option1"
                checked={decisionFilter === FilterOptions.NONE}
                onClick={() => this.setNewFilter(FilterOptions.NONE)}
              />
              <label className="form-check-label" htmlFor="filterRadios1">
                {browser.i18n.getMessage('noneText')}
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="filterRadios"
                id="filterRadios2"
                value="option2"
                checked={decisionFilter === FilterOptions.CLEAN}
                onClick={() => this.setNewFilter(FilterOptions.CLEAN)}
              />
              <label className="form-check-label" htmlFor="filterRadios2">
                {browser.i18n.getMessage('cleanText')}
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="filterRadios"
                id="filterRadios3"
                value="option3"
                checked={decisionFilter === FilterOptions.KEEP}
                onClick={() => this.setNewFilter(FilterOptions.KEEP)}
              />
              <label className="form-check-label" htmlFor="filterRadios3">
                {browser.i18n.getMessage('keepText')}
              </label>
            </div> */}
          </div>
          <IconButton
            iconName="trash"
            text={browser.i18n.getMessage('clearLogsText')}
            onClick={() => onClearActivityLogClick()}
            className="btn-warning"
          />
        </div>
        <ActivityTable decisionFilter={this.state.decisionFilter} />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onClearActivityLogClick() {
    dispatch(clearActivities());
  },
});

export default connect(null, mapDispatchToProps)(ActivityLog);
