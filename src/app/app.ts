// import {IpcRenderer} from 'electron';
import {IpcService} from "./IpcService";

const ipc = new IpcService();

document.getElementById('testbutton').addEventListener('click', async () => {
  console.log("Button pressed");
  const t = await ipc.send<{ message: string }>('system-info');
  document.getElementById('os-info').innerHTML = t.message;
});