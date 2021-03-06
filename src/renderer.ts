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
const sendBtn: HTMLInputElement = document.getElementById('sendButton') as HTMLInputElement;
const breakBtn: HTMLInputElement = document.getElementById('breakBtn') as HTMLInputElement;
const delayButtons: Array<HTMLInputElement> =
[
  document.getElementById('noPauseBtn') as HTMLInputElement,
  document.getElementById('xweakPauseBtn') as HTMLInputElement,
  document.getElementById('weakPauseBtn') as HTMLInputElement,
  document.getElementById('mediumPauseBtn') as HTMLInputElement,
  document.getElementById('strongPauseBtn') as HTMLInputElement,
  document.getElementById('xstrongPauseBtn') as HTMLInputElement
];

const speedButtons: Array<HTMLInputElement> =
[
  document.getElementById('slowBtn') as HTMLInputElement,
  document.getElementById('fastBtn') as HTMLInputElement
];

const pronounceButtons: Array<HTMLInputElement> =
[
  document.getElementById('numbersBtn') as HTMLInputElement,
  document.getElementById('lettersBtn') as HTMLInputElement
];

interface StatusMessage {
  message?: string;
}

console.log('👋 This message is being logged by "renderer.js", included via webpack');

/*
  Event Listeners
*/
sendBtn.addEventListener('click', async () => {
  // const t = await ipc.send<{ message: string }>('system-info');
  // document.getElementById('os-info').innerHTML = t.message;

  const data: string = speechTextBox.value;

  const request: IpcRequest = { params: [data] };
  const t = await ipc.send<{ message: string }>('system-info', request);
  console.log("Received message from IPC: ", t);
  sendBtn.blur();
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
      insertAtCursor(speechTextBox, "🕛");
      break;
    case "xweakPauseBtn":
      insertAtCursor(speechTextBox, "🕐");
      break;
    case "weakPauseBtn":
      insertAtCursor(speechTextBox, "🕑");
      break;
    case "mediumPauseBtn":
      insertAtCursor(speechTextBox, "🕒");
      break;
    case "strongPauseBtn":
      insertAtCursor(speechTextBox, "🕓");
      break;
    case "xstrongPauseBtn":
      insertAtCursor(speechTextBox, "🕔");
      break;
    default:
      break;
  }
  this.blur();
}

pronounceButtons.forEach(element => {
  element.addEventListener('click', pronounceBtnClicked);
});

// Event listeners for speed buttons
function pronounceBtnClicked(this: HTMLInputElement) {
  /*
  🕛: <break strength="none">no pause</break>
  🕐: <break strength="x-weak">x-weak pause</break>
  🕑: <break strength="weak">weak pause</break>
  🕒: <break strength="medium">medium pause</break>
  🕓: <break strength="strong">strong pause</break>
  🕔: <break strength="x-strong">x-strong pause</break>
  */
  switch (this.id) {
    case "numbersBtn":
      insertAtCursor(speechTextBox, "🔢🏁", "🔢🔚");
      break;
    case "lettersBtn":
      insertAtCursor(speechTextBox, "🔠🏁", "🔠🔚");
      break;
    default:
      break;
  }
  this.blur();
}

speedButtons.forEach(element => {
  element.addEventListener('click', speedBtnClicked);
});

// Event listeners for speed buttons
function speedBtnClicked(this: HTMLInputElement) {
  /*
  🕛: <break strength="none">no pause</break>
  🕐: <break strength="x-weak">x-weak pause</break>
  🕑: <break strength="weak">weak pause</break>
  🕒: <break strength="medium">medium pause</break>
  🕓: <break strength="strong">strong pause</break>
  🕔: <break strength="x-strong">x-strong pause</break>
  */
  switch (this.id) {
    case "slowBtn":
      insertAtCursor(speechTextBox, "🐢🏁", "🐢🔚");
      break;
    case "fastBtn":
      insertAtCursor(speechTextBox, "🚀🏁", "🚀🔚");
      break;
    default:
      break;
  }
  this.blur();
}

breakBtn.addEventListener('click', breakBtnClicked);

function breakBtnClicked(this: HTMLInputElement) {
  insertAtCursor(speechTextBox, "\n✂️\n");
  this.blur();
}

// Helper functions
function insertAtCursor(textArea: HTMLTextAreaElement, insertValue: string, insertValue2?: string) {
  const startPos = textArea.selectionStart;
  const endPos = textArea.selectionEnd;
  console.log("Start: ", startPos);
  console.log("End: ", endPos);
  if (startPos == endPos) {
    if (insertValue2) {
      insertValue = insertValue + "<INSERT TEXT HERE>" + insertValue2;
    }
    textArea.value = 
      textArea.value.substring(0, startPos)
      + insertValue
      + textArea.value.substring(endPos, textArea.value.length);
    textArea.selectionStart = startPos + insertValue.length;
    textArea.selectionEnd = startPos + insertValue.length;
  } else {
    const leftText = textArea.value.substring(0, startPos);
    const enclosedText = textArea.value.substring(startPos, endPos);
    const rightText = textArea.value.substring(endPos, textArea.value.length);
    console.log(leftText);
    console.log(insertValue);
    console.log(enclosedText);
    console.log(insertValue2);
    console.log(rightText);
    textArea.value = leftText + insertValue + enclosedText + insertValue2 + rightText;
    textArea.selectionStart = startPos + insertValue.length + enclosedText.length;
    textArea.selectionEnd = startPos + insertValue.length + enclosedText.length;
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


