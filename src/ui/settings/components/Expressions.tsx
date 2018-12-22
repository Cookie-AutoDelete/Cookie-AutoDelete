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
import { addExpressionUI } from '../../../redux/Actions';
import { getSetting } from '../../../services/Libs';
import { ReduxAction } from '../../../typings/ReduxConstants';
import ExpressionTable from '../../common_components/ExpressionTable';
import IconButton from '../../common_components/IconButton';

const styles = {
  tableContainer: {
    height: `${window.innerHeight - 210}px`,
    overflow: 'auto',
  },
};

interface OwnProps {
  style?: React.CSSProperties;
}

interface StateProps {
  lists: StoreIdToExpressionList;
  contextualIdentities: boolean;
}

interface DispatchProps {
  onNewExpression: (expression: Expression) => void;
}

type ExpressionProps = OwnProps & StateProps & DispatchProps;

class InitialState {
  public contextualIdentitiesObjects: browser.contextualIdentities.ContextualIdentity[] = [];
  public error: string = '';
  public expressionInput: string = '';
  public storeId: string = 'default';
}

class Expressions extends React.Component<ExpressionProps> {
  public state = new InitialState();

  // Import the expressions into the list
  public importExpressions(files: Blob[]) {
    const { onNewExpression } = this.props;
    const reader = new FileReader();
    reader.onload = file => {
      try {
        if (!file.target) throw Error('File not found');
        // https://stackoverflow.com/questions/35789498/new-typescript-1-8-4-build-error-build-property-result-does-not-exist-on-t
        const target: any = file.target;
        const result: string = target.result;
        const newExpressions: StoreIdToExpressionList = JSON.parse(result);
        const storeIds = Object.keys(newExpressions);
        storeIds.forEach(storeId =>
          newExpressions[storeId].forEach(expression =>
            onNewExpression(expression),
          ),
        );
      } catch (error) {
        this.setState({
          error: error.toString(),
        });
      }
    };

    reader.readAsText(files[0]);
  }

  // Add the expression using the + button or the Enter key
  public addExpressionByInput(payload: Expression) {
    const { onNewExpression } = this.props;
    onNewExpression(payload);
    this.setState({
      expressionInput: '',
    });
  }

  public getDerivedStateFromProps(nextProps: ExpressionProps) {
    if (!nextProps.contextualIdentities) {
      this.changeStoreIdTab('default');
    }
  }

  // Change the id of the storeId for the container tabs
  public changeStoreIdTab(storeId: string) {
    this.setState({
      storeId,
    });
  }

  public async componentDidMount() {
    if (this.props.contextualIdentities) {
      const contextualIdentitiesObjects = await browser.contextualIdentities.query(
        {},
      );
      this.setState({
        contextualIdentitiesObjects,
      });
    }
  }

  // Dynamically generate and append timestamp to download filename
  public exportAppendTimestamp(element: HTMLElement) {
    // We take into account the timezone offset since using Date.toISOString() returns in UTC/GMT.
    element.setAttribute(
      'download',
      `CAD_Expressions_${new Date(
        new Date().getTime() - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, -5)
        .replace('T', '_')
        .replace(/:/g, '.')}.json`,
    );
  }

  public render() {
    const { style, lists, contextualIdentities } = this.props;
    const { error, contextualIdentitiesObjects, storeId } = this.state;
    return (
      <div className="col" style={style}>
        <h1>{browser.i18n.getMessage('whiteListText')}</h1>

        <div className="row">
          <input
            style={{
              display: 'inline',
              width: '100%',
            }}
            value={this.state.expressionInput}
            onChange={e =>
              this.setState({
                expressionInput: e.target.value,
              })
            }
            placeholder={browser.i18n.getMessage('domainPlaceholderText')}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                this.addExpressionByInput({
                  expression: this.state.expressionInput,
                  listType: ListType.WHITE,
                  storeId,
                });
              }
            }}
            type="text"
            id="formText"
            className="form-control"
          />
        </div>

        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            paddingBottom: '8px',
            paddingTop: '8px',
          }}
        >
          <div
            className="col-sm-auto btn-group"
            style={{
              paddingLeft: 0,
              paddingRight: 0,
            }}
          >
            <IconButton
              tag="a"
              className="btn-primary"
              iconName="download"
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                JSON.stringify(this.props.lists, null, '  '),
              )}`}
              download="CAD_Expressions_Expressions.json"
              role="button"
              target="_blank"
              onClick={d => this.exportAppendTimestamp(d.target)}
              onContextMenu={d => this.exportAppendTimestamp(d.target)}
              title={browser.i18n.getMessage('exportURLSTitle')}
              text={browser.i18n.getMessage('exportURLSText')}
              styleReact={{
                height: '38px',
                width: '50%',
              }}
            />

            <IconButton
              tag="input"
              className="btn-info"
              iconName="upload"
              type="file"
              onChange={e => this.importExpressions(e.target.files)}
              text={browser.i18n.getMessage('importURLSText')}
              styleReact={{
                width: '50%',
              }}
            />
          </div>
          <div
            className="col-sm-auto btn-group"
            style={{
              justifyContent: 'flex-end',
              paddingLeft: 0,
              paddingRight: 0,
            }}
          >
            <IconButton
              className="btn-secondary"
              onClick={() => {
                this.addExpressionByInput({
                  expression: this.state.expressionInput,
                  listType: ListType.GREY,
                  storeId,
                });
              }}
              styleReact={{
                height: '38px',
                width: '50%',
              }}
              iconName="plus"
              title={browser.i18n.getMessage('toGreyListText')}
              text={browser.i18n.getMessage('greyListWordText')}
            />

            <IconButton
              className="btn-primary"
              onClick={() => {
                this.addExpressionByInput({
                  expression: this.state.expressionInput,
                  listType: ListType.WHITE,
                  storeId,
                });
              }}
              styleReact={{
                height: '38px',
                width: '50%',
              }}
              iconName="plus"
              title={browser.i18n.getMessage('toWhiteListText')}
              text={browser.i18n.getMessage('whiteListWordText')}
            />
          </div>
        </div>

        {error !== '' ? (
          <div
            onClick={() =>
              this.setState({
                error: '',
              })
            }
            className="row alert alert-danger"
          >
            {error}
          </div>
        ) : (
          ''
        )}
        {contextualIdentities ? (
          <ul className="row nav nav-tabs flex-column flex-sm-row">
            <li
              onClick={() => {
                this.changeStoreIdTab('default');
              }}
              className="nav-item"
            >
              <a
                className={`nav-link ${storeId === 'default' ? 'active' : ''}`}
                href="#tabExpressionList"
              >
                Default
              </a>
            </li>
            {contextualIdentitiesObjects.map(element => (
              <li
                key={`navTab-${element.cookieStoreId}`}
                onClick={() => {
                  this.changeStoreIdTab(element.cookieStoreId);
                }}
                className="nav-item"
              >
                <a
                  className={`nav-link ${
                    storeId === element.cookieStoreId ? 'active' : ''
                  }`}
                  href="#tabExpressionList"
                >
                  {element.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          ''
        )}

        <div className="row" style={styles.tableContainer}>
          <ExpressionTable
            expressionColumnTitle={browser.i18n.getMessage(
              'domainExpressionsText',
            )}
            expressions={lists[storeId]}
            storeId={storeId}
            emptyElement={
              <span>{browser.i18n.getMessage('noExpressionsText')}</span>
            }
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State) => {
  const { lists } = state;
  return {
    contextualIdentities: getSetting(state, 'contextualIdentities') as boolean,
    lists,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onNewExpression(payload: Expression) {
    dispatch(addExpressionUI(payload));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Expressions);
