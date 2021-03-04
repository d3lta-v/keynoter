import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
// import {IpcChannelInterface} from "./IPC/IpcChannelInterface";

// Import all channels here
import {SystemInfoChannel} from "./IPC/SystemInfoChannel";
const systemInfoChannel = new SystemInfoChannel();

// Determine the static validChannels here
const validChannels = [systemInfoChannel.getName(), "connection-state"];
validChannels.forEach(element => {
  validChannels.push(element + "_response");
});
console.log("Valid channels: ", validChannels);

//TODO: generate the dynamic validChannels here?

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
    send: (channel: string, data: unknown) => {
      // toMain
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, listener: (...args: unknown[]) => void) => {
      // fromMain
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
      }
    },
    receiveOnce: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
      // fromMain
      //TODO: perform valid channel identification
      // const validChannels = ["system-info_response"];
      // if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        // ^ Above statement is deprecated, we need to preserve the whole listener payload
        ipcRenderer.once(channel, listener);
      // }
    }
  }
  );