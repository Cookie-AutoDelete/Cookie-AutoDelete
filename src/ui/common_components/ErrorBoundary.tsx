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
import { resetAll } from '../../redux/Actions';
import { ReduxAction } from '../../typings/ReduxConstants';
import { exportAppendTimestamp } from '../UILibs';
import IconButton from './IconButton';

interface DispatchProps {
  onResetButtonClick: () => void;
}

interface StateProps {
  state: State;
}

type ErrorBoundaryProps = DispatchProps & StateProps;

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  public state = {
    hasError: false,
    message: '',
    resetButtonText: browser.i18n.getMessage('resetExtensionDataText'),
  };

  public componentDidCatch(error: any) {
    // Display fallback UI
    if (error !== 'state is undefined') {
      this.setState({
        hasError: true,
        message: `
            ${error.message}
            ${error.stack}
            at line ${error.lineNumber}
            `,
      });
    }
  }

  public async resetExtensionData() {
    await browser.storage.local.clear();
    this.props.onResetButtonClick();
    browser.runtime.reload();
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{this.state.message}</p>
          <hr />
          <p className="mb-0">
            <IconButton
              tag="a"
              className="btn-primary"
              iconName="download"
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                JSON.stringify(this.props.state.lists, null, '  '),
              )}`}
              download="CAD_Expressions_Expressions.json"
              role="button"
              target="_blank"
              onClick={d => exportAppendTimestamp(d.target)}
              onContextMenu={d => exportAppendTimestamp(d.target)}
              title={browser.i18n.getMessage('exportURLSTitle')}
              text={browser.i18n.getMessage('exportURLSText')}
              styleReact={{ marginRight: '5px' }}
            />
            <IconButton
              tag="a"
              className="btn-danger"
              iconName="skull-crossbones"
              onClick={() => this.resetExtensionData()}
              text={this.state.resetButtonText}
            />
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const mapStateToProps = (state: State) => {
  return {
    state,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onResetButtonClick() {
    dispatch(resetAll());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ErrorBoundary);
