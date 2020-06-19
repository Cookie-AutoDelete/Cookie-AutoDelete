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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { updateExpressionUI } from '../../redux/Actions';
import {
  isFirstPartyIsolate,
  returnOptionalCookieAPIAttributes,
} from '../../services/Libs';
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

const styles = {
  checkbox: {
    marginRight: '5px',
  } as React.CSSProperties,
};

const trimDotAndStar = (str: string) => {
  const trimmed = str.replace(/^[.*]+|[.*]+$/g, '');
  if (trimmed === '') return undefined;
  return trimmed;
};

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
    const exp = expression.expression;
    const firstPartyIsolate = await isFirstPartyIsolate();
    let cookies: browser.cookies.CookieProperties[] = [];
    if (exp.startsWith('/') && exp.endsWith('/')) {
      // Treat expression as regular expression.  Get all cookies then regex domain.
      const allCookies = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(
          this.props.state,
          {
            storeId: this.toPublicStoreId(expression.storeId),
          },
          firstPartyIsolate,
        ),
      );
      if (exp.slice(1).startsWith('file:')) {
        // Regex with Local Directories
        const regExp = new RegExp(exp.slice(8, -1)); // take out file://
        cookies = allCookies.filter(
          (cookie) => cookie.domain === '' && regExp.test(cookie.path),
        );
      } else {
        const regExp = new RegExp(exp.slice(1, -1));
        cookies = allCookies.filter((cookie) => regExp.test(cookie.domain));
      }
    } else if (exp.startsWith('file:')) {
      const allCookies = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(
          this.props.state,
          {
            storeId: this.toPublicStoreId(expression.storeId),
          },
          firstPartyIsolate,
        ),
      );
      const regExp = new RegExp(exp.slice(7)); // take out file://
      cookies = allCookies.filter(
        (cookie) => cookie.domain === '' && regExp.test(cookie.path),
      );
    } else {
      cookies = await browser.cookies.getAll(
        returnOptionalCookieAPIAttributes(
          this.props.state,
          {
            domain: `${trimDotAndStar(exp)}${exp.endsWith('.') ? '.' : ''}`,
            storeId: this.toPublicStoreId(expression.storeId),
          },
          firstPartyIsolate,
        ),
      );
    }
    this.setState({ cookies });
  }

  public createCookieList(
    cookies: browser.cookies.CookieProperties[],
    expression: Expression,
  ) {
    const { onUpdateExpression } = this.props;
    const originalCookieNames = expression.cookieNames || [];
    const cookieNamesSet = new Set(originalCookieNames);
    const cookieNames = Array.from(
      new Set([
        ...(expression.cookieNames || []),
        ...cookies.map((a) => a.name),
      ]),
    ).sort((a, b) => a.localeCompare(b));
    return cookieNames.map((name) => {
      const checked = cookieNamesSet.has(name);
      const key = `${checked}-${expression.id}-${name}`;
      return (
        <div style={{ marginLeft: '20px' }} key={key} className={'checkbox'}>
          <span
            className={'addHover'}
            onClick={() => {
              onUpdateExpression({
                ...expression,
                cookieNames: checked
                  ? originalCookieNames.filter(
                      (cookieName) => cookieName !== name,
                    )
                  : [...originalCookieNames, name],
              });
            }}
          >
            <FontAwesomeIcon
              id={key}
              style={styles.checkbox}
              size={'lg'}
              icon={['far', checked ? 'check-square' : 'square']}
              role="checkbox"
              aria-checked={checked as boolean}
            />
            <label htmlFor={key} area-labelledby={key}>
              {name}
            </label>
          </span>
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
    const { expression, state } = this.props;
    const keyLocalStorage = `${expression.id}-cleanLocalStorage`;
    const keyCleanAllCookies = `${expression.id}-cleanAllCookies`;

    const dropList = coerceBoolean(expression.cleanAllCookies);
    return (
      <div>
        {!expression.expression.startsWith('file:') &&
          ((state.cache.browserDetect === 'Firefox' &&
            state.cache.browserVersion >= '57' &&
            state.cache.platformOs !== 'android') ||
            state.cache.browserDetect === 'Chrome') && (
            <div className={'checkbox'}>
              <span
                className={'addHover'}
                onClick={() =>
                  this.toggleCleanLocalstorage(!expression.cleanLocalStorage)
                }
              >
                <FontAwesomeIcon
                  id={keyLocalStorage}
                  style={styles.checkbox}
                  size={'lg'}
                  icon={[
                    'far',
                    expression.cleanLocalStorage ? 'square' : 'check-square',
                  ]}
                  role="checkbox"
                  aria-checked={!expression.cleanLocalStorage as boolean}
                />
                <label
                  htmlFor={keyLocalStorage}
                  aria-labelledby={keyLocalStorage}
                >
                  {browser.i18n.getMessage('keepLocalstorageText')}
                </label>
              </span>
            </div>
          )}
        {}
        <div className={'checkbox'}>
          <span
            className={'addHover'}
            onClick={() =>
              this.toggleCleanAllCookies(
                !(
                  expression.cleanAllCookies === undefined ||
                  expression.cleanAllCookies
                ),
              )
            }
          >
            <FontAwesomeIcon
              id={keyCleanAllCookies}
              style={styles.checkbox}
              size={'lg'}
              icon={[
                'far',
                expression.cleanAllCookies === undefined ||
                expression.cleanAllCookies
                  ? 'check-square'
                  : 'square',
              ]}
              role="checkbox"
              aria-checked={
                (expression.cleanAllCookies === undefined ||
                  expression.cleanAllCookies) as boolean
              }
            />
            <label
              htmlFor={keyCleanAllCookies}
              aria-labelledby={keyCleanAllCookies}
            >
              {browser.i18n.getMessage('keepAllCookiesText')}
            </label>
          </span>
        </div>
        {dropList && (
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {this.createCookieList(cookies, expression)}
          </div>
        )}
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

export default connect(mapStateToProps, mapDispatchToProps)(ExpressionOptions);
