import {IpcChannelInterface} from "./IpcChannelInterface";
import {IpcMainEvent, BrowserWindow, dialog, app} from 'electron';
import fs from 'fs';
import path from 'path';
import {IpcRequest} from "../shared/IpcRequest";
import axios, { AxiosRequestConfig } from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';

axiosCookieJarSupport(axios);
const cookieJar = new tough.CookieJar();
interface WJsonResponse {
  status?: string;
  message?: string;
}

export class SystemInfoChannel implements IpcChannelInterface {
  getName(): string {
    return 'system-info';
  }

  handle(event: IpcMainEvent, request: IpcRequest): void {
    if (!request.responseChannel) {
      // This automatically gives it a response channel, if it does not have a response channel.
      request.responseChannel = `${this.getName()}_response`;
    }

    //TODO: we should trim() the user input for obvious reasons

    // User text processing should go here
    /*
      For user text processing, there should be a few steps:
      1. Trim whitespace from every line
      2. Each newline can be treated as a 0.5s break.
      3. Ensure every line has a full stop
      4. Use emojis as start and stop symbols for SSML
    
      SimpleSSML Specifications
      🕛🕐🕑🕒🕓🕔🕕: Time demarcators, used to indicate a delay in speech
      🚀🚀🐢🐢: Speed demarcators, used to indicate faster or slower speech, and by how much. Each emoji represents +/-5% change
      🔠🔢: Indicate for the synthesizer to read out individual or numbers.
    */
    if (!request.params) {
      // Return as there's no text to process
      return;
    }


    // Create base
    // const BASE = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbQ==", "base64").toString('ascii');
    // const ax = axios.create({baseURL: BASE});

    // Web stuff goes here
    const pay1 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvc3RvcmU=", "base64").toString('ascii');
    const pay2 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvbmV3U3ludGhlc2l6ZT92b2ljZT1lbi1VU19NaWNoYWVsVjNWb2ljZSZpZD1iZDk4ZTBlMi1jMTlkLTQzNDgtOTEyZC00ZWE4N2NjZGM4ZjI=", "base64").toString('ascii');
    const request1Body: string = JSON.stringify({"ssmlText":request.params[0],"sessionID":"bd98e0e2-c19d-4348-912d-4ea87ccdc8f2"});
    const request1Config: AxiosRequestConfig = {
      method: 'post',
      url: pay1,
      headers: { 
        'Content-Type': 'application/json'
      },
      jar: cookieJar,
      data : request1Body,
      withCredentials: true,
    };
    const request2Config: AxiosRequestConfig = {
      method: 'get',
      url: pay2,
      jar: cookieJar,
      responseType: 'stream',
      responseEncoding: 'binary',
      withCredentials: true,
    };

    const getSpeechFile = async () => {
      try {
        // Create file save dialogue first
        const win = BrowserWindow.getFocusedWindow();
        const options = {
          title: "Save speech file:",
          defaultPath : path.resolve(app.getPath("downloads")) + "/speech.mp3", 
          buttonLabel : "Save File",
          filters :[
            {name: 'MP3 Audio File', extensions: ['mp3']},
            {name: 'All Files', extensions: ['*']}
          ]
        }
        const saveDialogResult = await dialog.showSaveDialog(win, options)
        if (saveDialogResult.canceled){
          throw new Error("Save cancelled");
        }

        event.sender.send("connection-state", { message: "Initialising download..." });
        
        const payload1 = await axios(request1Config);
        const jsonResponse: WJsonResponse = payload1.data;
        if (jsonResponse.status == "success") {
          console.log("Received successful response: ", jsonResponse.message);
          event.sender.send("connection-state", { message: "Downloading audio..." });
        } else {
          throw new Error("Unsuccessful 1st payload injection: " + jsonResponse.message);
        }

        const writer = fs.createWriteStream(saveDialogResult.filePath, {encoding: null});
        // axios(request2Config)
        // .then(async (response: any) => {
        //   response.data.pipe(writer);
        // });

        axios(request2Config)
        .then((response) => {
          response.data.pipe(writer);
          
          var downloaded = 0;
          response.data.on('data', (data: ArrayBuffer) => {
            downloaded += Buffer.byteLength(data);
            const downloadProgress = downloaded / 1000;
            event.sender.send("connection-state", { message: "Downloading audio (" + downloadProgress + " KB done)" });
          });
          response.data.on('end', () => {
            // event.sender.send('downloadEnd')
            event.sender.send("connection-state", { message: "Download complete!" });
          })
          response.data.on('error', (error: Error) => {
            // event.sender.send('downloadError', error)
          })
        });

        // const payload2 = await axios(request2Config);
        // if (payload2.status == 200) {
        //   // response is good! save the file
        //   event.sender.send("connection-state", { message: "Download complete!" });
        //   fs.writeFileSync(saveDialogResult.filePath, payload2.data, {encoding: null});
        //   console.log("File saved to: ", saveDialogResult);
        // }
      } catch (err) {
        //TODO: properly show errors thru the user interface
        event.sender.send("connection-state", { message: (err as Error).message });
        console.log(err);
      }
    }

    getSpeechFile();

    // This is where you create and send the response data back once it is completed.
    // Example, when you want to send back System Information:
    // event.sender.send(request.responseChannel, { kernel: execSync('uname -a').toString() });
    // console.log("Sent event from SystemInfoChannel with response channel: ", request.responseChannel);
    // event.sender.send(request.responseChannel, { message: request.params[0] + "_appended" });
  }
}
