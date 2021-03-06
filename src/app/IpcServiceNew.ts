// import {IpcRenderer} from 'electron';
import {IpcRequest} from "../shared/IpcRequest";

export class IpcServiceNew {
//   private ipcRenderer?: IpcRenderer;

  public send<T>(channel: string, request: IpcRequest = {}): Promise<T> {
    // If the ipcRenderer is not available try to initialize it
    
    // if (!this.ipcRenderer) {
    //   this.initializeIpcRenderer();
    // }
    // If there's no responseChannel let's auto-generate it
    if (!request.responseChannel) {
      request.responseChannel = `${channel}_response_${new Date().getTime()}`
    }

    // const ipcRenderer = this.ipcRenderer;
    // ipcRenderer.send(channel, request);
    window.api.send(channel, request);
    console.log(`Sent IPC API to ${channel} with request: ${request}`);

    // This method returns a promise which will be resolved when the response has arrived.
    return new Promise(resolve => {
    //   ipcRenderer.once(request.responseChannel, (event, response) => resolve(response));
      console.log("Promise resolved");
      window.api.receiveOnce(request.responseChannel, (event: unknown, response: never) => resolve(response));
    });

    // window.api.send("system-info", data);
  }

//   private initializeIpcRenderer() {
//     if (!window || !window.process || !window.require) {
//       throw new Error(`Unable to require renderer process`);
//     }
//     this.ipcRenderer = window.require('electron').ipcRenderer;
//   }
}