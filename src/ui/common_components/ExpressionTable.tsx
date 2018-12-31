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
import { Dispatch } from 'redux';
import { removeExpressionUI, updateExpressionUI } from '../../redux/Actions';
import { ReduxAction } from '../../typings/ReduxConstants';
import ExpressionOptions from './ExpressionOptions';
import IconButton from './IconButton';

class EmptyState {
  public expressionInput: string = '';
  public editMode: boolean = false;
  public id: string | undefined = '';
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
    this.setState(new EmptyState());
  }

  public commitEdit() {
    const original = (this.props.expressions || []).find(
      expression => expression.id === this.state.id,
    );
    if (original) {
      this.props.onUpdateExpression({
        ...original,
        expression: this.state.expressionInput,
        storeId: this.props.storeId,
      });
    }
    this.setState(new EmptyState());
  }

  public render() {
    const {
      onRemoveExpression,
      onUpdateExpression,
      expressionColumnTitle,
      emptyElement,
    } = this.props;
    const { editMode, id, expressionInput } = this.state;
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
            <th>
              {/* {browser.i18n.getMessage('regularExpressionEquivalentText')} */}
              {'Options'}
            </th>

            <th>{browser.i18n.getMessage('listTypeText')}</th>
          </tr>
        </thead>
        <tbody className="expressionTable">
          {expressions.map(expression => (
            <tr key={expression.id}>
              <td
                style={{
                  textAlign: 'center',
                }}
              >
                <IconButton
                  title={browser.i18n.getMessage('removeExpressionText')}
                  className="btn-light"
                  iconName="trash"
                  onClick={() => {
                    onRemoveExpression(expression);
                  }}
                />
              </td>
              {editMode && id === expression.id ? (
                <td className="editableExpression">
                  <input
                    ref={c => {
                      this.editInput = c;
                    }}
                    className="form-control"
                    value={expressionInput}
                    onFocus={this.moveCaretToEnd}
                    onChange={e =>
                      this.setState({
                        expressionInput: e.target.value,
                      })
                    }
                    type="text"
                    autoFocus={true}
                    style={{
                      display: 'inline-block',
                      margin: 0,
                      verticalAlign: 'middle',
                      width: 'calc(100% - 70px)',
                    }}
                  />
                  <IconButton
                    title={browser.i18n.getMessage('stopEditingText')}
                    className="btn-light"
                    iconName="ban"
                    styleReact={{
                      float: 'right',
                      marginLeft: '5px',
                    }}
                    onClick={() => {
                      this.clearEdit();
                    }}
                  />
                  <IconButton
                    title={browser.i18n.getMessage('saveExpressionText')}
                    className="btn-light"
                    iconName="save"
                    styleReact={{
                      float: 'right',
                      marginLeft: '5px',
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
                    className="btn-light showOnRowHover"
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
                  className="btn-light showOnRowHover"
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
}

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onRemoveExpression(payload: Expression) {
    dispatch(removeExpressionUI(payload));
  },
  onUpdateExpression(payload: Expression) {
    dispatch(updateExpressionUI(payload));
  },
});
export default connect(
  null,
  mapDispatchToProps,
)(ExpressionTable);
