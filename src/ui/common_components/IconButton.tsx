/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  FontAwesomeIcon,
  type FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import React from 'react';

interface IconButtonProps {
  accept?: string;
  iconName: IconProp;
  iconSize?: FontAwesomeIconProps['size'];
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
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function IconButton({
  className = '',
  iconName,
  iconSize,
  styleReact,
  tag,
  text,
  ...nativeProps
}: IconButtonProps) {
  // Has to be PascalCase, else JSX will think it's a tag named 'tagName'.
  // Determine the element type; input tags are wrapped in a label
  const TagName = (
    tag === 'input' ? 'label' : (tag ?? 'button')
  ) as React.ElementType;

  return (
    <TagName
      {...nativeProps}
      className={`btn ${className}`}
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
        size={iconSize}
      />
      {text}
      {tag === 'input' && (
        <input
          {...(nativeProps as React.InputHTMLAttributes<HTMLInputElement>)}
          style={{ display: 'none' }}
        />
      )}
    </TagName>
  );
}
