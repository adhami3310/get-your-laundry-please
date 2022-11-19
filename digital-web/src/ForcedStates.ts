import { MachineStatus } from "./Machines";

export const forcedDryers = [MachineStatus.NONE, MachineStatus.BROKEN, MachineStatus.NONE, MachineStatus.NONE];
export const dryersMapping = [2, 3, 1, 0];

export const forcedWashers = [MachineStatus.NONE, MachineStatus.NONE, MachineStatus.NONE];
export const washersMapping = [0, 1, 2];