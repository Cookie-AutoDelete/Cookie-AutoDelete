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
import { resetAll } from '../../redux/Actions';
import { ReduxAction } from '../../typings/ReduxConstants';
import { downloadObjectAsJSON } from '../UILibs';
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
          <h4 className="alert-heading">
            {browser.i18n.getMessage('errorText')}
          </h4>
          <p>{this.state.message}</p>
          <hr />
          <p className="mb-0">
            <IconButton
              className="btn-primary"
              iconName="download"
              role="button"
              onClick={() => downloadObjectAsJSON(this.props.state.lists, 'CAD_Expressions')}
              title={browser.i18n.getMessage('exportTitleTimestamp')}
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
