/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import {IpcServiceNew} from "./app/IpcServiceNew";
import {IpcRequest} from "./shared/IpcRequest";

/*
  Key variables and constants
*/
const ipc = new IpcServiceNew();
const speechTextBox: HTMLTextAreaElement = document.getElementById('speechToSynth') as HTMLTextAreaElement;
const currentStatusPara: HTMLParagraphElement = document.getElementById('currentStatus') as HTMLParagraphElement;
const delayButtons: Array<HTMLInputElement> =
[
  document.getElementById('noPauseBtn') as HTMLInputElement,
  document.getElementById('xweakPauseBtn') as HTMLInputElement,
  document.getElementById('weakPauseBtn') as HTMLInputElement,
  document.getElementById('mediumPauseBtn') as HTMLInputElement,
  document.getElementById('strongPauseBtn') as HTMLInputElement,
  document.getElementById('xstrongPauseBtn') as HTMLInputElement
];

interface StatusMessage {
  message?: string;
}

console.log('👋 This message is being logged by "renderer.js", included via webpack');

/*
  Event Listeners
*/
document.getElementById('sendButton').addEventListener('click', async () => {
  // const t = await ipc.send<{ message: string }>('system-info');
  // document.getElementById('os-info').innerHTML = t.message;

  const data: string = speechTextBox.value;
  // window.api.send("system-info", data);
  // window.api.send("system-info");

  const request: IpcRequest = { params: [data] };
  const t = await ipc.send<{ message: string }>('system-info', request);
  console.log("Received message from IPC: ", t);
});

window.api.receive("connection-state", (data: StatusMessage) => {
  console.log(data);
  currentStatusPara.textContent = data.message;
});


// Event listeners for pause buttons
delayButtons.forEach(element => {
  element.addEventListener('click', delayBtnClicked);
});

function delayBtnClicked(this: HTMLInputElement) {
  /*
  🕛: <break strength="none">no pause</break>
  🕐: <break strength="x-weak">x-weak pause</break>
  🕑: <break strength="weak">weak pause</break>
  🕒: <break strength="medium">medium pause</break>
  🕓: <break strength="strong">strong pause</break>
  🕔: <break strength="x-strong">x-strong pause</break>
  */
  switch (this.id) {
    case "noPauseBtn":
      insertAtCursor(speechTextBox, "[[silence:0ms]]");
      break;
    case "xweakPauseBtn":
      insertAtCursor(speechTextBox, "[[silence:50ms]]");
      break;
    case "weakPauseBtn":
      insertAtCursor(speechTextBox, "[[silence:100ms]]");
      break;
    case "mediumPauseBtn":
      insertAtCursor(speechTextBox, "[[silence:500ms]]");
      break;
    case "strongPauseBtn":
      insertAtCursor(speechTextBox, "[[silence:1000ms]]");
      break;
    case "xstrongPauseBtn":
      insertAtCursor(speechTextBox, "[[silence:2000ms]]");
      break;
    default:
      break;
  }
}

function insertAtCursor(myField: HTMLTextAreaElement, myValue: string) {
  if (myField.selectionStart) {
      var startPos = myField.selectionStart;
      var endPos = myField.selectionEnd;
      myField.value = myField.value.substring(0, startPos)
          + myValue
          + myField.value.substring(endPos, myField.value.length);
      myField.selectionStart = startPos + myValue.length;
      myField.selectionEnd = startPos + myValue.length;
  } else {
      myField.value += myValue;
  }
}

/*
Last time, the event listener should look something like this

import {IpcService} from "./IpcService";

const ipc = new IpcService();

document.getElementById('testbutton').addEventListener('click', async () => {
  console.log("Button pressed");
  const t = await ipc.send<{ message: string }>('system-info');
  document.getElementById('os-info').innerHTML = t.message;
});
*/


