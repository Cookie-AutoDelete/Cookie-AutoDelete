// Font Awesome Import start
import { library } from '@fortawesome/fontawesome-svg-core';
// Import fonts like this to avoid tree shaking
import { faCheckSquare } from '@fortawesome/free-regular-svg-icons/faCheckSquare';
import { faSquare } from '@fortawesome/free-regular-svg-icons/faSquare';
import { faBan } from '@fortawesome/free-solid-svg-icons/faBan';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faEraser } from '@fortawesome/free-solid-svg-icons/faEraser';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons/faExchangeAlt';
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons/faPowerOff';
import { faSave } from '@fortawesome/free-solid-svg-icons/faSave';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faUndo } from '@fortawesome/free-solid-svg-icons/faUndo';
import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload';

export default () => {
  library.add(
    faCheckSquare,
    faSquare,
    faBan,
    faBars,
    faBell,
    faCog,
    faDownload,
    faEraser,
    faExchangeAlt,
    faPen,
    faPlus,
    faPowerOff,
    faSave,
    faTrash,
    faUndo,
    faUpload,
  );
};
