/**
 * Copyright (c) 2018 Kenny Do
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
import { updateExpressionUI } from '../../redux/Actions';
import { returnOptionalCookieAPIAttributes } from '../../services/Libs';
import { ReduxAction } from '../../typings/ReduxConstants';
interface DispatchProps {
  onUpdateExpression: (payload: Expression) => void;
}
interface StateProps {
  state: State;
}
interface OwnProps {
  expression: Expression;
}

class InitialState {
  public cookies: browser.cookies.CookieProperties[] = [];
}

type ExpressionOptionsProps = OwnProps & DispatchProps & StateProps;

const trimDotAndStar = (str: string) => str.replace(/^[\.\*]+|[\.\*]+$/g, '');

/**
 * cleanAllCookies => droplist
 * undefined => false
 * false => true
 * true => false
 */
const coerceBoolean = (bool: boolean | undefined) => {
  if (bool === undefined) return false;
  return !bool;
};
class ExpressionOptions extends React.Component<ExpressionOptionsProps> {
  public state = new InitialState();

  public async componentDidMount() {
    if (coerceBoolean(this.props.expression.cleanAllCookies)) {
      await this.getAllCookies();
    }
  }
  /** Converts an expression default storeId to the defaults of the browser */
  public toPublicStoreId(storeId: string) {
    const browser: string = this.props.state.cache.browserDetect;
    if (storeId === 'default' && browser === 'Chrome') {
      return '0';
    }
    if (storeId === 'default' && browser === 'Firefox') {
      return 'firefox-default';
    }
    return storeId;
  }

  public async getAllCookies() {
    const { expression } = this.props;
    const cookies = await browser.cookies.getAll(
      returnOptionalCookieAPIAttributes(this.props.state, {
        domain: trimDotAndStar(expression.expression),
        storeId: this.toPublicStoreId(expression.storeId),
      }),
    );
    this.setState({ cookies });
  }

  public createCookieList(
    cookies: browser.cookies.CookieProperties[],
    expression: Expression,
  ) {
    const { onUpdateExpression } = this.props;
    const cookieNames = expression.cookieNames || [];
    return cookies.map(cookie => {
      const checked =
        expression.cookieNames && expression.cookieNames.includes(cookie.name);
      const key = `${checked}-${expression.id}-${cookie.name}`;
      return (
        <div style={{ marginLeft: '20px' }} key={key} className={'checkbox'}>
          <input
            className={'form-check-input addHover'}
            checked={checked}
            type="checkbox"
            id={key}
            onChange={e => {
              if (e.target.checked) {
                onUpdateExpression({
                  ...expression,
                  cookieNames: [...cookieNames, cookie.name],
                });
              } else {
                onUpdateExpression({
                  ...expression,
                  cookieNames: cookieNames.filter(name => name !== cookie.name),
                });
              }
            }}
          />
          <label className={'form-check-label addHover'} htmlFor={key}>
            {cookie.name}
          </label>
        </div>
      );
    });
  }

  public toggleCleanAllCookies(checked: boolean) {
    const { expression, onUpdateExpression } = this.props;
    if (!coerceBoolean(expression.cleanAllCookies)) {
      this.getAllCookies();
    }
    onUpdateExpression({
      ...expression,
      cleanAllCookies: checked,
    });
  }

  public toggleCleanLocalstorage(checked: boolean) {
    const { expression, onUpdateExpression } = this.props;
    onUpdateExpression({
      ...expression,
      cleanLocalStorage: checked,
    });
  }

  public render() {
    const { cookies } = this.state;
    const { expression } = this.props;

    const dropList = coerceBoolean(expression.cleanAllCookies);
    const cleanLocalstorageKey = `${expression.id}-localstorage`;
    const keepAllCookiesKey = `${expression.id}-droplist`;
    return (
      <div>
        <div className={'checkbox'}>
          <input
            className={'form-check-input addHover'}
            checked={!expression.cleanLocalStorage}
            type="checkbox"
            onChange={e => this.toggleCleanLocalstorage(!e.target.checked)}
            id={cleanLocalstorageKey}
          />
          <label
            className={'form-check-label addHover'}
            htmlFor={cleanLocalstorageKey}
          >
            {'Keep Localstorage'}
          </label>
        </div>
        {}
        <div className={'checkbox'}>
          <input
            className={'form-check-input addHover'}
            checked={
              expression.cleanAllCookies === undefined ||
              expression.cleanAllCookies
            }
            type="checkbox"
            onChange={e => this.toggleCleanAllCookies(e.target.checked)}
            id={keepAllCookiesKey}
          />
          <label
            className={'form-check-label addHover'}
            htmlFor={keepAllCookiesKey}
          >
            {'Keep all cookies'}
          </label>
        </div>
        {dropList && this.createCookieList(cookies, expression)}
      </div>
    );
  }
}

const mapStateToProps = (state: State) => {
  return {
    state,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onUpdateExpression(payload: Expression) {
    dispatch(updateExpressionUI(payload));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ExpressionOptions);
