import { MachineStatus } from "./Machines";

export const forcedDryers = [MachineStatus.NONE, MachineStatus.NOIDEA, MachineStatus.NONE, MachineStatus.NOIDEA];
export const dryersMapping = [2, 1, 3, 0];

export const forcedWashers = [MachineStatus.NONE, MachineStatus.NOIDEA, MachineStatus.NONE];
export const washersMapping = [0, 1, 2];