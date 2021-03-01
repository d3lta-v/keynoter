import {IpcChannelInterface} from "./IpcChannelInterface";
import {IpcMainEvent} from 'electron';
import {IpcRequest} from "../shared/IpcRequest";

export class SystemInfoChannel implements IpcChannelInterface {
  getName(): string {
    return 'system-info';
  }

  handle(event: IpcMainEvent, request: IpcRequest): void {
    if (!request.responseChannel) {
      // This automatically gives it a response channel, if it does not have a response channel.
      request.responseChannel = `${this.getName()}_response`;
    }
    // This is where you create and send the response data back once it is completed.
    // Example, when you want to send back System Information:
    // event.sender.send(request.responseChannel, { kernel: execSync('uname -a').toString() });
    console.log("Sent event from SystemInfoChannel with response channel: ", request.responseChannel);
    event.sender.send(request.responseChannel, { message: request.params[0] + "_appended" });
  }
}
