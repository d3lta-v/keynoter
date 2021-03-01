import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {IpcChannelInterface} from "./IPC/IpcChannelInterface";

// Import all channels here
import {SystemInfoChannel} from "./IPC/SystemInfoChannel";
var systemInfoChannel = new SystemInfoChannel();

// Determine the static validChannels here
var validChannels = [systemInfoChannel.getName()];
validChannels.forEach(element => {
  validChannels.push(element + "_response");
});
console.log("Valid channels: ", validChannels);

//TODO: generate the dynamic validChannels here?

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
    send: (channel: string, data: any) => {
      // toMain
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      // fromMain
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        // ^ Above statement is deprecated, we need to preserve the whole listener payload
        ipcRenderer.on(channel, listener);
      }
    },
    receiveOnce: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      // fromMain
      //TODO: perform valid channel identification
      // const validChannels = ["system-info_response"];
      // if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, listener);
      // }
    }
  }
  );