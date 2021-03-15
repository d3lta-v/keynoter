import {IpcChannelInterface} from "./IpcChannelInterface";
import {IpcMainEvent, BrowserWindow, dialog, app} from 'electron';
import fs from 'fs';
import path from 'path';
import {IpcRequest} from "../shared/IpcRequest";
import axios, { AxiosRequestConfig } from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import * as lame from 'lame';

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
      🕛: <break strength="none">no pause</break>
      🕐: <break strength="x-weak">x-weak pause</break>
      🕑: <break strength="weak">weak pause</break>
      🕒: <break strength="medium">medium pause</break>
      🕓: <break strength="strong">strong pause</break>
      🕔: <break strength="x-strong">x-strong pause</break>
      🕕: Time demarcators, used to indicate a delay in speech
      🚀🚀🐢🐢: Speed demarcators, used to indicate faster or slower speech, and by how much. Each emoji represents +/-5% change
      🔚: Ending character, to designate that a section has ended
      🔠🔢: Indicate for the synthesizer to read out individual or numbers.
    */
    if (!request.params) {
      // Return as there's no text to process
      return;
    }
    let textToSynth = request.params[0];
    // First stage: escaping XML characters
    // TODO
    // Second stage: injecting delays
    const replacementMap: { [key: string]: string} = {
      "🕛": "<break strength=\"none\">no pause</break>",
      "🕐": "<break strength=\"x-weak\">x-weak pause</break>",
      "🕑": "<break strength=\"weak\">weak pause</break>",
      "🕒": "<break strength=\"medium\">medium pause</break>",
      "🕓": "<break strength=\"strong\">strong pause</break>",
      "🕔": "<break strength=\"x-strong\">x-strong pause</break>"
    };
    for (const key in replacementMap) {
      if (Object.prototype.hasOwnProperty.call(replacementMap, key)) {
        const element = replacementMap[key];
        textToSynth = textToSynth.replace(key, element);
      }
    }

    // Third stage: speed markers
    const sectionMarkers: string[] = [];
    const startMarkerPos: number[] = [];
    const endMarkerPos: number[] = [];
    let textSubStr = 0;
    for (const ch of textToSynth) {
      console.log(ch);
      if (ch == "🚀" || ch == "🐢") {
        sectionMarkers.push(ch);
        startMarkerPos.push(textSubStr);
      } else if (ch == "🔚") {
        endMarkerPos.push(textSubStr);
      }
      textSubStr++;
    }

    // let ssml = parser.parseToSsml(textToSynth, "en-GB");
    // ssml = ssml.replace("<?xml version=\"1.0\" encoding=\"UTF-8\"?><speak version=\"1.1\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis/synthesis.xsd\" xml:lang=\"en-GB\">", "");
    // ssml = ssml.replace("</speak>", "");

    console.log("Target SSML: ", textToSynth);

    // Create base
    // const BASE = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbQ==", "base64").toString('ascii');
    // const ax = axios.create({baseURL: BASE});

    // Web stuff goes here
    const pay1 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvc3RvcmU=", "base64").toString('ascii');
    const pay2 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvbmV3U3ludGhlc2l6ZT92b2ljZT1lbi1VU19NaWNoYWVsVjNWb2ljZSZpZD1iZDk4ZTBlMi1jMTlkLTQzNDgtOTEyZC00ZWE4N2NjZGM4ZjI=", "base64").toString('ascii');
    const request1Body: string = JSON.stringify({"ssmlText":textToSynth,"sessionID":"bd98e0e2-c19d-4348-912d-4ea87ccdc8f2"});
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
      // responseEncoding: 'binary',
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

        event.sender.send("connection-state", { message: "Starting download..." });
        
        const payload1 = await axios(request1Config);
        const jsonResponse: WJsonResponse = payload1.data;
        if (jsonResponse.status == "success") {
          console.log("Received successful response: ", jsonResponse.message);
          event.sender.send("connection-state", { message: "Synthesizing audio..." });
        } else {
          fs.unlinkSync(saveDialogResult.filePath);
          throw new Error("Unsuccessful 1st payload injection: " + jsonResponse.message);
        }

        // Check if file is being used.
        if (fs.existsSync(saveDialogResult.filePath)) {
          try {
            const fileHandle = await fs.promises.open(saveDialogResult.filePath, fs.constants.O_RDONLY | 0x10000000);
            fileHandle.close();
          } catch (error) {
            if (error.code === 'EBUSY'){
              throw new Error("MP3 file is busy");
            } else {
              throw error;
            }
          }
        }

        const writer = fs.createWriteStream(saveDialogResult.filePath, {encoding: null});
        // axios(request2Config)
        // .then(async (response: any) => {
        //   response.data.pipe(writer);
        // });

        axios(request2Config)
        .then((response) => {
          let downloaded = 0;
          // response.data.pipe(writer);
          const decoder = lame.Decoder();
          decoder.on('format', (format: lame.EncoderOptions) =>  {
            // Re-encode MP3 from a badly made VBR file into a 96kbps CBR file
            const encoder = lame.Encoder({
              float: format.float,
              // input
              channels: format.channels,
              bitDepth: format.bitDepth,
              sampleRate: format.sampleRate,
              // output
              bitRate: 96,
              outSampleRate: format.sampleRate,
              mode: format.mode
            });

            event.sender.send("connection-state", { message: "Encoding audio..." });

            encoder.on('finish', () => {
              event.sender.send("connection-state", { message: "Speech synthesis complete!" });
            });
            decoder.pipe(encoder).pipe(writer);
          });
          response.data.pipe(decoder);
          
          response.data.on('data', (data: ArrayBuffer) => {
            downloaded += Buffer.byteLength(data);
            const downloadProgress = downloaded / 1000;
            event.sender.send("connection-state", { message: "Downloading audio (" + downloadProgress + " KB done)" });
          });
          response.data.on('end', () => {            
            event.sender.send("connection-state", { message: "Download complete!" });
          })
          response.data.on('error', (error: Error) => {
            // event.sender.send('downloadError', error)
            fs.unlinkSync(saveDialogResult.filePath);
            throw error;
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
        event.sender.send("connection-state", { message: "Error: " + (err as Error).message });
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
