import {IpcChannelInterface} from "./IpcChannelInterface";
import {IpcMainEvent, BrowserWindow, dialog, app, SaveDialogReturnValue} from 'electron';
import fs from 'fs';
import path from 'path';
import {IpcRequest} from "../shared/IpcRequest";
import axios, { AxiosRequestConfig } from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import * as lame from 'lame';
import * as parser from 'fast-xml-parser';
import { v4 as uuidv4 } from 'uuid';

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
    <prosody rate="+5%"> </prosody>
    🔚: Ending character, to designate that a section has ended
    🔢: <say-as interpret-as="digits"> </say-as>
    🔠: <say-as interpret-as="letters">Hello</say-as>
    */
    if (!request.params) {
      // Return as there's no text to process
      return;
    }
    let textToSynth = request.params[0];
    let arraySynth: string[];
    
    // Escape any XML-like characters
    textToSynth = this.escapeXml(textToSynth);
    
    // Break up text into array to be parsed as multiple audio files using ✂️
    arraySynth = textToSynth.split("✂️");
    
    const replacementMap: { [key: string]: string} = {
      "🕛": "<break strength=\"none\">no pause</break>",
      "🕐": "<break strength=\"x-weak\">x-weak pause</break>",
      "🕑": "<break strength=\"weak\">weak pause</break>",
      "🕒": "<break strength=\"medium\">medium pause</break>",
      "🕓": "<break strength=\"strong\">strong pause</break>",
      "🕔": "<break strength=\"x-strong\">x-strong pause</break>",
      "🚀🏁": "<prosody rate=\"+5%\">",
      "🐢🏁": "<prosody rate=\"-5%\">",
      "🚀🔚": "</prosody>",
      "🐢🔚": "</prosody>",
      "🔢🏁": "<say-as interpret-as=\"digits\">",
      "🔠🏁": "<say-as interpret-as=\"letters\">",
      "🔢🔚": "</say-as>",
      "🔠🔚": "</say-as>",
    };
    
    for (let i=0; i<arraySynth.length; i++) {
      for (const key in replacementMap) {
        if (Object.prototype.hasOwnProperty.call(replacementMap, key)) {
          const element = replacementMap[key];
          const reg = RegExp(key, "g"); // initiate global replacement
          arraySynth[i] = arraySynth[i].replace(reg, element);
        }
      }
    }
    
    const xmlHeader = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><speak version=\"1.1\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis/synthesis.xsd\" xml:lang=\"en-GB\">";
    const xmlFooter = "</speak>";
    console.log("Target SSML: ", arraySynth);
    arraySynth.forEach(element => {
      // Validate SSML in each part of the array
      const validationResult = parser.validate(xmlHeader + element + xmlFooter);
      if (validationResult === true) { //optional (it'll return an object in case it's not valid)
      console.log("XML validation successful!");
    } else {
      console.log(validationResult);
      event.sender.send("connection-state", { message: "Invalid input! Please check your entry" });
      return;
    }
    
    // Perform leftover emoji check
    if (/\p{Extended_Pictographic}/u.test(element) === true) {
      event.sender.send("connection-state", { message: "Invalid input: your entry has emojis inside!" });
      return
    }
  });
  
  const getSpeechFile = async (req1Config: AxiosRequestConfig, req2Config: AxiosRequestConfig, filePath: string, index?: number, total?: number) => {
    event.sender.send("connection-state", { message: "Starting download..." });
    
    const payload1 = await axios(req1Config);
    const jsonResponse: WJsonResponse = payload1.data;
    if (jsonResponse.status == "success") {
      console.log("Received successful response: ", jsonResponse.message);
      event.sender.send("connection-state", { message: "Synthesizing audio..." });
    } else {
      fs.unlinkSync(filePath);
      throw new Error("Server error: " + jsonResponse.message);
    }
    
    // Check if file is being used.
    if (fs.existsSync(filePath)) {
      try {
        const fileHandle = await fs.promises.open(filePath, fs.constants.O_RDONLY | 0x10000000);
        fileHandle.close();
      } catch (error) {
        if (error.code === 'EBUSY'){
          throw new Error("MP3 file is busy");
        } else {
          throw error;
        }
      }
    }
    
    const writer = fs.createWriteStream(filePath, {encoding: null});
    // axios(request2Config)
    // .then(async (response: any) => {
    //   response.data.pipe(writer);
    // });
    
    axios(req2Config)
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
        fs.unlinkSync(filePath);
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
  }
  
  // Main loop goes here
  (async () => {
    try {
      const multipleAudioFiles = arraySynth.length > 1;
      
      // Prompt user for their files
      const fileSaveDialogueResult = await this.promptUser(multipleAudioFiles);
      if (fileSaveDialogueResult.canceled) {
        throw new Error("Save cancelled");
      }
      
      for (let i=0; i < arraySynth.length; i++) {
        const sessionID: string = uuidv4(); // generate fresh sessionID for each audio clip
        const pay1 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvc3RvcmU=", "base64").toString('ascii');
        const pay2 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvbmV3U3ludGhlc2l6ZT92b2ljZT1lbi1VU19NaWNoYWVsVjNWb2ljZSZpZD0=", "base64").toString('ascii') + sessionID;
        const request1Body: string = JSON.stringify({"ssmlText": arraySynth[i], "sessionID": sessionID});
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
        
        // Let the requests finish synchronously as we don't want to flood the endpoint
        if (arraySynth.length === 1) {
          await getSpeechFile(request1Config, request2Config, fileSaveDialogueResult.filePath);
        } else {
          // If multiple requests, we have to mutate the filepath a bit to ensure they have unique names
          const oneUseFilePath = fileSaveDialogueResult.filePath.slice(0, -4) + "-" + (i+1) + ".mp3";
          await getSpeechFile(request1Config, request2Config, oneUseFilePath, i+1, arraySynth.length);
        }
      }
    } catch (err) {
      //TODO: properly show errors thru the user interface
      if (err.code == "ENOTFOUND") {
        event.sender.send("connection-state", { message: "Inactive Internet connection! This app requires an Internet connection" });
      } else {
        event.sender.send("connection-state", { message: "Error: " + (err as Error).message });
      }
      console.log(err);
    }
  })();
  
  // This is where you create and send the response data back once it is completed.
  // Example, when you want to send back System Information:
  // event.sender.send(request.responseChannel, { kernel: execSync('uname -a').toString() });
  // console.log("Sent event from SystemInfoChannel with response channel: ", request.responseChannel);
  // event.sender.send(request.responseChannel, { message: request.params[0] + "_appended" });
}

async promptUser(multiple: boolean): Promise<SaveDialogReturnValue> {
  const dialogTitle = multiple ? "Save multiple speech files:" : "Save speech file:";
  const win = BrowserWindow.getFocusedWindow();
  const options = {
    title: dialogTitle,
    defaultPath : path.resolve(app.getPath("downloads")) + "/speech.mp3", 
    buttonLabel : "Save File",
    filters :[
      {name: 'MP3 Audio File', extensions: ['mp3']},
      {name: 'All Files', extensions: ['*']}
    ]
  }
  const saveDialogResult = await dialog.showSaveDialog(win, options)
  return saveDialogResult;
}

escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
}
