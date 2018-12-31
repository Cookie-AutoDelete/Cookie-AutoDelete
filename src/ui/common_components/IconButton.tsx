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
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';

interface IconButtonProps {
  iconName: IconProp;
  className: string;
  styleReact?: React.CSSProperties;
  text?: string;
  tag?: string;
  href?: string;
  type?: string;
  title?: string;
  download?: string;
  role?: string;
  target?: string;
  onClick?: (e: any) => void;
  onChange?: (e: any) => void;
  onContextMenu?: (e: any) => void;
}

export default class IconButton extends React.Component<IconButtonProps> {
  public render() {
    const { iconName, className, styleReact, text, tag } = this.props;

    const nativeProps = {
      ...this.props,
      iconName: undefined,
      tag: undefined,
      text: undefined,
    };
    // Has to be PascalCase, else JSX will think it's a tag named 'tagName'.
    const TagName = tag === 'input' ? 'label' : tag || 'button';
    return (
      // @ts-ignore
      <TagName
        {...nativeProps}
        className={`btn ${className || ''}`}
        style={{
          cursor: tag === 'input' ? 'pointer' : undefined,
          ...styleReact,
        }}
      >
        <FontAwesomeIcon
          style={
            text
              ? {
                  marginRight: '5px',
                }
              : undefined
          }
          icon={iconName}
        />
        {text}
        {tag === 'input' ? (
          <input
            {...nativeProps}
            style={{
              display: 'none',
            }}
          />
        ) : null}
      </TagName>
    );
  }
}
