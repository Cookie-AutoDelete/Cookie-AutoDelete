/* istanbul ignore file: FontAwesome Font Imports */
// Font Awesome Import start
import { library } from '@fortawesome/fontawesome-svg-core';
// Import fonts like this to avoid tree shaking
import { faCheckSquare } from '@fortawesome/free-regular-svg-icons/faCheckSquare';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons/faQuestionCircle';
import { faSquare } from '@fortawesome/free-regular-svg-icons/faSquare';
import { faBan } from '@fortawesome/free-solid-svg-icons/faBan';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { faBellSlash } from '@fortawesome/free-solid-svg-icons/faBellSlash';
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';
import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faEraser } from '@fortawesome/free-solid-svg-icons/faEraser';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons/faExchangeAlt';
import { faListAlt } from '@fortawesome/free-solid-svg-icons/faListAlt';
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons/faPowerOff';
import { faSave } from '@fortawesome/free-solid-svg-icons/faSave';
import { faSkullCrossbones } from '@fortawesome/free-solid-svg-icons/faSkullCrossbones';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faUndo } from '@fortawesome/free-solid-svg-icons/faUndo';
import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload';

export default (): void => {
  library.add(
    faCheckSquare,
    faQuestionCircle,
    faSquare,
    faBan,
    faBars,
    faBell,
    faBellSlash,
    faCog,
    faCopy,
    faDownload,
    faEraser,
    faExchangeAlt,
    faListAlt,
    faPen,
    faPlus,
    faPowerOff,
    faSave,
    faSkullCrossbones,
    faTrash,
    faUndo,
    faUpload,
  );
};
