"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.washersMapping = exports.forcedWashers = exports.dryersMapping = exports.forcedDryers = void 0;
const Machines_1 = require("./Machines");
exports.forcedDryers = [Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.NONE];
exports.dryersMapping = [2, 1, 3, 0];
exports.forcedWashers = [Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.NOIDEA, Machines_1.MachineStatus.NONE];
exports.washersMapping = [0, 1, 2];
//# sourceMappingURL=ForcedStates.js.map