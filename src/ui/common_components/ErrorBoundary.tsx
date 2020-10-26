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
import { cadLog } from '../../services/Libs';
import { ReduxAction } from '../../typings/ReduxConstants';
import { downloadObjectAsJSON } from '../UILibs';
import IconButton from './IconButton';

// This fixes the error thrown when upgrading react-redux from 7.1.7 to 7.1.8
interface ChildrenProps {
  children: React.ReactNode;
}

interface DispatchProps {
  onResetButtonClick: () => void;
}

interface StateProps {
  state: State;
}

type ErrorBoundaryProps = ChildrenProps & DispatchProps & StateProps;

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  public static getDerivedStateFromError(error: Error) {
    // update state so next render will show fallback UI
    if (error.message !== 'state is undefined') {
      return { error, hasError: true };
    }
    return { hasError: false };
  }

  public state = {
    error: null as Error | null,
    hasError: false,
  };

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Shouldn't update state here but can be used to log errors somewhere else.
    cadLog(
      {
        msg: `React ErrorBoundary - An Error was caught:  ${error}`,
        type: 'error',
        x: { message: error.message, stack: error.stack, errorInfo },
      },
      true,
    );
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
        <div className="alert alert-danger alertPreWrap" role="alert">
          <h4 className="alert-heading">
            {browser.i18n.getMessage('errorText')}
          </h4>
          {this.state.error && this.state.error.toString()}
          <br />
          {this.state.error && this.state.error.stack && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.error.stack}
            </details>
          )}
          <hr />
          <p className="mb-0">
            <IconButton
              className="btn-primary"
              iconName="download"
              role="button"
              onClick={() =>
                downloadObjectAsJSON(this.props.state.settings, 'CoreSettings')
              }
              title={browser.i18n.getMessage('exportTitleTimestamp')}
              text={browser.i18n.getMessage('exportSettingsText')}
              styleReact={{ marginRight: '5px' }}
            />
            <IconButton
              className="btn-primary"
              iconName="download"
              role="button"
              onClick={() =>
                downloadObjectAsJSON(this.props.state.lists, 'Expressions')
              }
              title={browser.i18n.getMessage('exportTitleTimestamp')}
              text={browser.i18n.getMessage('exportURLSText')}
              styleReact={{ marginRight: '5px' }}
            />
            <IconButton
              tag="a"
              className="btn-danger"
              iconName="skull-crossbones"
              onClick={() => this.resetExtensionData()}
              title={browser.i18n.getMessage('resetExtensionDataText')}
              text={browser.i18n.getMessage('resetExtensionDataText')}
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

export default connect(mapStateToProps, mapDispatchToProps)(ErrorBoundary);
