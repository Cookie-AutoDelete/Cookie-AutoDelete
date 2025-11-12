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

import { getMatchedExpressions } from '../../../services/Libs';
import ExpressionTable from '../../common_components/ExpressionTable';
import { useUISelector } from '../../hooks';
import { shallowEqual } from 'react-redux';

interface OwnProps {
  url: string;
  storeId: string;
}

const FilteredExpression: React.FunctionComponent<OwnProps> = (props) => {
  const { storeId, url } = props;

  const expressions = useUISelector(
    (state) => getMatchedExpressions(state.lists, storeId, url),
    shallowEqual,
  );

  return (
    <ExpressionTable
      expressionColumnTitle={browser.i18n.getMessage(
        'matchedDomainExpressionText',
      )}
      expressions={expressions}
      storeId={storeId}
      emptyElement={
        <div className="alert alert-primary col mb-0" role="alert">
          <i>{browser.i18n.getMessage('noRulesText')}</i>
        </div>
      }
    />
  );
};

export default FilteredExpression;
