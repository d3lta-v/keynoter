import {IpcChannelInterface} from "./IpcChannelInterface";
import {IpcMainEvent, BrowserWindow, dialog, app} from 'electron';
import fs from 'fs';
import path from 'path';
import {IpcRequest} from "../shared/IpcRequest";

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

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

    // Web stuff goes here
    const pay1 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvc3RvcmU=", "base64").toString('ascii');
    const pay2 = Buffer.from("aHR0cHM6Ly93d3cuaWJtLmNvbS9kZW1vcy9saXZlL3R0cy1kZW1vL2FwaS90dHMvbmV3U3ludGhlc2l6ZT92b2ljZT1lbi1VU19NaWNoYWVsVjNWb2ljZSZpZD1iZDk4ZTBlMi1jMTlkLTQzNDgtOTEyZC00ZWE4N2NjZGM4ZjI=", "base64").toString('ascii');
    const request1Body: string = JSON.stringify({"ssmlText":request.params[0],"sessionID":"bd98e0e2-c19d-4348-912d-4ea87ccdc8f2"});
    const request1Config: AxiosRequestConfig = {
      method: 'post',
      url: pay1,
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': '_abck=90B8E18474DEC2B6D733D2D798CD5F6C~-1~YAAQVN6bfGBRuNt3AQAA0haL7AVq96GKI+lnQ9lLYZAIk/WaHb9R0mCZIqKck6boKqwanYSOjZn0iM7S1VsdV+A+E0R53Rlc0l0eyo3xQRSWtv7XEled3MWzcOhGH3g8El4Zy7Csg6jLLtg4WejsdeebFgEDKcwxVYjjlfpNOoZXGHv93DJNilSc3wuucmtMnM0aWxP9FwQJaKO8bTm3zU04AVO3rXJcSinG8UhVq2NQvORflTN0v4+4yz5OuSUjNV0HjAgw7Ptk0OjGqdXpN2Y9XXmgFLMk6PisYYwWZ7mpmRNeD38GWhL3GLWxBK6qDs3uuZPnB07lsXpaUyi7Z4EbllVXPTPGRcC2O8wjYA==~-1~-1~-1; ak_bmsc=8B6090BC76E80DE79B9C52C668461E1A7C9BDE54F57F00001A8E3C604A9EA66A~plEJwb0K+JIN50Pris2SggbtkJPPlRUyStIMJ9a6NeK8MEkLJ0WIxJ/0ya4l/q7NzbaupeiSFnqa6+sqaa+F/5R0W0EZ9Z4SD7MYf05n06nyQcxzFqeZ63ngnRk2uAMPE+iczO8n9rns5wzs5ImahkGsPQeN9eFG9p87VAWm4LLGZrYu/oKXWJDkVUxGusCpnVefAzrSmninbbJnrEHaMsfwJiXiREwmNsBxuIBJ1Ugeg=; bm_sz=A8ADC40CC5CF884A90E0ECF36A72DA2B~YAAQVN6bfF9RuNt3AQAA0haL7AqtSp2RBe/XqgkwB1sSap0uWnv5Dwi0R1ICvybUumeRWR9Jj/8V+snAscz8i8Vd9tNTT23SdlylpBU6mWihwE3RD6GKj25pSv0gnr6oKziFMUJ+6ghT37E4KLyUc0GzD0hcaLkExzGAt8M+kBfbaxePKFDMEpQBKOS7; 848c305b58c818e6f2a11125da17c831=77f8646a12f2e6b917d237fe1439239f; tts-demo=s%3A1hhMbBK4arAwyLfVPEqf_Enqd-eV0fRZ.x39b%2Bp08nTFh75kDn%2F0E4h2Nc3WURIbDw1eDAWRW3JA'
      },
      data : request1Body,
      withCredentials: true
    };
    const request2Config: AxiosRequestConfig = {
      method: 'get',
      url: pay2,
      headers: {
        'Cookie': '_abck=90B8E18474DEC2B6D733D2D798CD5F6C~-1~YAAQVN6bfGBRuNt3AQAA0haL7AVq96GKI+lnQ9lLYZAIk/WaHb9R0mCZIqKck6boKqwanYSOjZn0iM7S1VsdV+A+E0R53Rlc0l0eyo3xQRSWtv7XEled3MWzcOhGH3g8El4Zy7Csg6jLLtg4WejsdeebFgEDKcwxVYjjlfpNOoZXGHv93DJNilSc3wuucmtMnM0aWxP9FwQJaKO8bTm3zU04AVO3rXJcSinG8UhVq2NQvORflTN0v4+4yz5OuSUjNV0HjAgw7Ptk0OjGqdXpN2Y9XXmgFLMk6PisYYwWZ7mpmRNeD38GWhL3GLWxBK6qDs3uuZPnB07lsXpaUyi7Z4EbllVXPTPGRcC2O8wjYA==~-1~-1~-1; ak_bmsc=8B6090BC76E80DE79B9C52C668461E1A7C9BDE54F57F00001A8E3C604A9EA66A~plEJwb0K+JIN50Pris2SggbtkJPPlRUyStIMJ9a6NeK8MEkLJ0WIxJ/0ya4l/q7NzbaupeiSFnqa6+sqaa+F/5R0W0EZ9Z4SD7MYf05n06nyQcxzFqeZ63ngnRk2uAMPE+iczO8n9rns5wzs5ImahkGsPQeN9eFG9p87VAWm4LLGZrYu/oKXWJDkVUxGusCpnVefAzrSmninbbJnrEHaMsfwJiXiREwmNsBxuIBJ1Ugeg=; bm_sz=A8ADC40CC5CF884A90E0ECF36A72DA2B~YAAQVN6bfF9RuNt3AQAA0haL7AqtSp2RBe/XqgkwB1sSap0uWnv5Dwi0R1ICvybUumeRWR9Jj/8V+snAscz8i8Vd9tNTT23SdlylpBU6mWihwE3RD6GKj25pSv0gnr6oKziFMUJ+6ghT37E4KLyUc0GzD0hcaLkExzGAt8M+kBfbaxePKFDMEpQBKOS7; 848c305b58c818e6f2a11125da17c831=77f8646a12f2e6b917d237fe1439239f; tts-demo=s%3A1hhMbBK4arAwyLfVPEqf_Enqd-eV0fRZ.x39b%2Bp08nTFh75kDn%2F0E4h2Nc3WURIbDw1eDAWRW3JA'
      },
      responseType: 'arraybuffer',
      responseEncoding: 'binary',
      // withCredentials: true
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

        const payload1 = await axios(request1Config);
        const jsonResponse: WJsonResponse = payload1.data;
        if (jsonResponse.status == "success") {
          console.log("Received successful response: ", jsonResponse.message);
        } else {
          throw new Error("Unsuccessful 1st payload injection: " + jsonResponse.message);
        }

        // const writer = fs.createWriteStream(saveDialogResult.filePath);
        // axios(request2Config)
        // .then(async (response: any) => {
        //   response.data.pipe(writer);
        // });

        const payload2 = await axios(request2Config);
        if (payload2.status == 200) {
          // response is good! save the file
          fs.writeFileSync(saveDialogResult.filePath, payload2.data, {encoding: null});
          console.log("File saved to: ", saveDialogResult);
        }
      } catch (err) {
        //TODO: show errors thru the user interface
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
