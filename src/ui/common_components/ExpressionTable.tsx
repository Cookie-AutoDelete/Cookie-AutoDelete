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
import { removeExpressionUI, updateExpressionUI } from '../../redux/Actions';
import { ReduxAction } from '../../typings/ReduxConstants';
import ExpressionOptions from './ExpressionOptions';
import IconButton from './IconButton';

class EmptyState {
  public expressionInput = '';
  public editMode = false;
  public id: string | undefined = '';
  public invalid = '';
}

interface OwnProps {
  expressions: ReadonlyArray<Expression>;
  expressionColumnTitle: string;
  storeId: string;
  emptyElement: JSX.Element;
}

interface DispatchProps {
  onRemoveExpression: (payload: Expression) => void;
  onUpdateExpression: (payload: Expression) => void;
}

type ExpressionTableProps = DispatchProps & OwnProps;

class ExpressionTable extends React.Component<
  ExpressionTableProps,
  EmptyState
> {
  private editInput: HTMLInputElement | undefined | null;
  constructor(props: ExpressionTableProps) {
    super(props);
    this.state = new EmptyState();
  }

  public startEditing(expression: Expression) {
    this.setState({
      editMode: true,
      expressionInput: expression.expression,
      id: expression.id,
      invalid: '',
    });
  }

  public componentDidUpdate() {
    if (
      this.editInput &&
      this.state.editMode &&
      document.activeElement !== document.getElementById('formText')
    ) {
      this.editInput.focus();
    }
  }

  public moveCaretToEnd(e: any) {
    const tempValue = e.target.value;
    e.target.value = '';
    e.target.value = tempValue;
  }

  public clearEdit() {
    if (this.editInput) {
      if (this.editInput.parentElement) {
        this.editInput.parentElement.classList.remove('was-validated');
      }
      this.editInput.setCustomValidity('');
      this.editInput.checkValidity();
      this.editInput = undefined;
    }
    this.setState(new EmptyState());
  }

  public commitEdit() {
    if (!this.validateEdit()) return;
    const original = (this.props.expressions || []).find(
      (expression) => expression.id === this.state.id,
    );
    if (original) {
      this.props.onUpdateExpression({
        ...original,
        expression: this.state.expressionInput,
        storeId: this.props.storeId,
      });
    }
    this.setState(new EmptyState());
    this.editInput = undefined;
  }

  public validateEdit(): boolean {
    if (!this.state.editMode || !this.editInput || !this.state.id) return false;
    const inputTrim = this.state.expressionInput.trim();
    if (!inputTrim) {
      return this.setInvalid(browser.i18n.getMessage('inputErrorEmpty'));
    }
    if (inputTrim.startsWith('/') && inputTrim.endsWith('/')) {
      // Regular Expression
      try {
        new RegExp(inputTrim.slice(1, -1));
      } catch (e) {
        return this.setInvalid(
          browser.i18n.getMessage('inputErrorComma', [`${e}`]),
        );
      }
    } else if (inputTrim.startsWith('/')) {
      // missing end slash.
      return this.setInvalid(
        browser.i18n.getMessage('inputErrorSlashStartMissingEnd'),
      );
    } else if (inputTrim.endsWith('/')) {
      // missing beginning slash, or not regex
      return this.setInvalid(
        browser.i18n.getMessage('inputErrorSlashEndMissingStart'),
      );
    } else if (inputTrim.indexOf(',') !== -1) {
      // no commas allowed in non-regex
      return this.setInvalid(browser.i18n.getMessage('inputErrorComma'));
    }
    // Past this point, presume valid expression entry.
    this.editInput.setCustomValidity('');
    if (this.editInput.parentElement) {
      this.editInput.parentElement.classList.remove('was-validated');
    }
    this.editInput.checkValidity();
    return true;
  }

  public render() {
    const {
      onRemoveExpression,
      onUpdateExpression,
      expressionColumnTitle,
      emptyElement,
    } = this.props;
    const { editMode, id, expressionInput, invalid } = this.state;
    const expressions =
      this.props.expressions === undefined ? [] : this.props.expressions;

    if (expressions.length === 0) {
      return emptyElement;
    }

    return (
      <table className={'table table-striped table-hover table-bordered'}>
        <thead>
          <tr>
            <th />
            <th>{expressionColumnTitle}</th>
            <th>{browser.i18n.getMessage('optionsText')}</th>
            <th>{browser.i18n.getMessage('listTypeText')}</th>
          </tr>
        </thead>
        <tbody className="expressionTable">
          {expressions.map((expression) => (
            <tr key={`${expression.expression}-${expression.listType}`}>
              <td
                style={{
                  textAlign: 'center',
                }}
              >
                <IconButton
                  title={browser.i18n.getMessage('removeExpressionText')}
                  className="btn-outline-danger"
                  iconName="trash"
                  onClick={() => {
                    onRemoveExpression(expression);
                  }}
                />
              </td>
              {editMode && id === expression.id ? (
                <td className="editableExpression">
                  <input
                    ref={(c) => {
                      this.editInput = c;
                    }}
                    className="form-control"
                    value={expressionInput}
                    onFocus={this.moveCaretToEnd}
                    onChange={(e) =>
                      this.setState({
                        expressionInput: e.target.value,
                      })
                    }
                    onKeyUp={(e) => {
                      if (e.key.toLowerCase().includes('enter')) {
                        this.commitEdit();
                      }
                    }}
                    type="url"
                    autoFocus={true}
                    style={{
                      display: 'inline-block',
                      margin: 0,
                      verticalAlign: 'middle',
                    }}
                  />
                  <div className="invalid-feedback">{invalid}</div>
                  <IconButton
                    title={browser.i18n.getMessage('stopEditingText')}
                    className="btn-outline-danger"
                    iconName="ban"
                    styleReact={{
                      float: 'left',
                      marginTop: '8px',
                      width: '45%',
                    }}
                    onClick={() => {
                      this.clearEdit();
                    }}
                  />
                  <IconButton
                    title={browser.i18n.getMessage('saveExpressionText')}
                    className="btn-outline-success"
                    iconName="save"
                    styleReact={{
                      float: 'right',
                      marginTop: '8px',
                      width: '45%',
                    }}
                    onClick={() => {
                      this.commitEdit();
                    }}
                  />
                </td>
              ) : (
                <td>
                  <div
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  >
                    {`${expression.expression}`}
                  </div>
                  <IconButton
                    title={browser.i18n.getMessage('editExpressionText')}
                    iconName="pen"
                    className="btn-outline-info showOnRowHover"
                    styleReact={{
                      float: 'right',
                      marginLeft: '5px',
                    }}
                    onClick={() => {
                      this.startEditing(expression);
                    }}
                  />
                </td>
              )}
              <td>
                <div
                  style={{
                    verticalAlign: 'middle',
                  }}
                >
                  <ExpressionOptions expression={expression} />
                </div>
              </td>
              <td>
                <div
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }}
                >
                  {`${
                    expression.listType === 'WHITE'
                      ? browser.i18n.getMessage('whiteListWordText')
                      : browser.i18n.getMessage('greyListWordText')
                  }`}
                </div>
                <IconButton
                  title={`${
                    expression.listType === 'WHITE'
                      ? browser.i18n.getMessage('toggleToGreyListWordText')
                      : browser.i18n.getMessage('toggleToWhiteListWordText')
                  }`}
                  iconName="exchange-alt"
                  className="btn-outline-dark showOnRowHover"
                  styleReact={{
                    float: 'right',
                    marginLeft: '5px',
                  }}
                  onClick={() =>
                    onUpdateExpression({
                      ...expression,
                      listType:
                        expression.listType === ListType.GREY
                          ? ListType.WHITE
                          : ListType.GREY,
                    })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  private setInvalid(s: string): boolean {
    if (!this.editInput) return false;
    this.setState({
      invalid: s,
    });
    this.editInput.setCustomValidity(s);
    if (this.editInput.parentElement) {
      this.editInput.parentElement.classList.add('was-validated');
    }
    this.editInput.checkValidity();
    // should always return false since we set error above.
    return false;
  }
}

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onRemoveExpression(payload: Expression) {
    dispatch(removeExpressionUI(payload));
  },
  onUpdateExpression(payload: Expression) {
    dispatch(updateExpressionUI(payload));
  },
});
export default connect(null, mapDispatchToProps)(ExpressionTable);
