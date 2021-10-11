const moduleAlias = require('module-alias')
moduleAlias.addAlias('@', __dirname)

/** moment settings */
import moment from "moment-timezone";
import momentDurationFormatSetup from "moment-duration-format";

moment.tz.setDefault("Europe/Kiev");
momentDurationFormatSetup(moment);

import { startBot } from '@/app'

/** launch */
startBot()