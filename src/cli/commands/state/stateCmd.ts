import { Command } from "../command";
import { StateListCommand } from "./stateListCmd";
import { StatePatchCommand } from "./statePatchCmd";
import { StatePutCommand } from "./statePutCmd";
import { StatePrintCommand } from "./statePrintCmd";
import { StateClearCommand } from "./stateClearCmd";
import { StateMoveCommand } from "./stateMoveCmd";
import { StateCopyCommand } from "./stateCopyCmd";

export const StateCommand: Command = {
  name: "state",
  subcommands: {
    default: StateListCommand,
    commands: [
      StateListCommand,
      StatePatchCommand,
      StatePutCommand,
      StatePrintCommand,
      StateClearCommand,
      StateMoveCommand,
      StateCopyCommand,
    ],
  },
};
