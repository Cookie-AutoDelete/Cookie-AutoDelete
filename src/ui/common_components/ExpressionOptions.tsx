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

const styles = {
  checkbox: {
    marginRight: '5px',
  } as React.CSSProperties,
};

const trimDotAndStar = (str: string) => {
  const trimmed = str.replace(/^[\.\*]+|[\.\*]+$/g, '');
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
    const originalCookieNames = expression.cookieNames || [];
    const cookieNamesSet = new Set(originalCookieNames);
    const cookieNames = Array.from(
      new Set([...(expression.cookieNames || []), ...cookies.map(a => a.name)]),
    ).sort((a, b) => a.localeCompare(b));
    return cookieNames.map(name => {
      const checked = cookieNamesSet.has(name);
      const key = `${checked}-${expression.id}-${name}`;
      return (
        <div style={{ marginLeft: '20px' }} key={key} className={'checkbox'}>
          <span
            className={'addHover'}
            onClick={() => {
              if (!checked) {
                onUpdateExpression({
                  ...expression,
                  cookieNames: [...originalCookieNames, name],
                });
              } else {
                onUpdateExpression({
                  ...expression,
                  cookieNames: originalCookieNames.filter(
                    cookieName => cookieName !== name,
                  ),
                });
              }
            }}
          >
            {checked ? (
              <FontAwesomeIcon
                style={styles.checkbox}
                size={'lg'}
                icon={['far', 'check-square']}
              />
            ) : (
              <FontAwesomeIcon
                style={styles.checkbox}
                size={'lg'}
                icon={['far', 'square']}
              />
            )}
            <label>{name}</label>
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

    const dropList = coerceBoolean(expression.cleanAllCookies);
    return (
      <div>
        {state.cache.browserDetect === 'Firefox' &&
          state.cache.platformOs !== 'android' && (
            <div className={'checkbox'}>
              <span
                className={'addHover'}
                onClick={() =>
                  this.toggleCleanLocalstorage(!expression.cleanLocalStorage)
                }
              >
                {!expression.cleanLocalStorage ? (
                  <FontAwesomeIcon
                    style={styles.checkbox}
                    size={'lg'}
                    icon={['far', 'check-square']}
                  />
                ) : (
                  <FontAwesomeIcon
                    style={styles.checkbox}
                    size={'lg'}
                    icon={['far', 'square']}
                  />
                )}
                <label>{browser.i18n.getMessage('keepLocalstorageText')}</label>
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
            {expression.cleanAllCookies === undefined ||
            expression.cleanAllCookies ? (
              <FontAwesomeIcon
                style={styles.checkbox}
                size={'lg'}
                icon={['far', 'check-square']}
              />
            ) : (
              <FontAwesomeIcon
                style={styles.checkbox}
                size={'lg'}
                icon={['far', 'square']}
              />
            )}
            <label>{browser.i18n.getMessage('keepAllCookiesText')}</label>
          </span>
        </div>
        {dropList && (
          <div style={{ height: '150px', overflow: 'auto' }}>
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ExpressionOptions);
