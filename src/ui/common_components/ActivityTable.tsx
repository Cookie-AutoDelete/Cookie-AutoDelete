/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
import browser from 'webextension-polyfill';
import {
  FilterOptions
} from '../../typings/Enums';
import { useUISelector } from '../hooks';

import {
  selectActivityLog
} from '../../redux/ActivityLogSlice';
import ActivityItem from './ActivityItem';

interface OwnProps {
  decisionFilter: FilterOptions;
  numberToShow?: number;
}

type ActivityTableProps = OwnProps;

const AlertNoLogsAvailable = () => (
  <div
    className="alert alert-primary col"
    style={{ marginBlockEnd: '0.75rem' }}
    role="alert"
  >
    <i>
      {browser.i18n.getMessage('noCleanupLogText')}
      <br /> {browser.i18n.getMessage('noPrivateLogging')}
    </i>
  </div>
);

const ActivityTable: React.FunctionComponent<ActivityTableProps> = (props) => {
  const { numberToShow } = props;

  const activityLog = useUISelector(selectActivityLog);

  if (activityLog.length === 0) {
    return <AlertNoLogsAvailable />;
  }

  const filtered = activityLog.slice(0, numberToShow || 10);

  return (
    <div
      className="accordion col px-0"
      style={{ marginBlockEnd: '0.75rem' }}
      id="accordion"
    >
      {filtered.map((log, index) => (
        <ActivityItem key={index} log={log} index={index} />
      ))}
    </div>
  );
};

export default ActivityTable;
