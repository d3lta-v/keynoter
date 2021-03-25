A no-frills, easy to use text to speech (TTS) software (that requires Internet access).

## Basic Usage Guide

Keynoter uses a custom markup language to describe speech called SimpleSSML (Simple Speech Synthesis Markup Language), a strict modified subset of the [Speech Synthesis Markup Language (SSML)](https://en.wikipedia.org/wiki/Speech_Synthesis_Markup_Language). This language uses emojis to convey different vocalisation parameters, such as speed, delays, pronounciation.

Additionally, the scissor emoji (✂️) allows you to splice the text into multiple audio files, meaning that you can generate multiple audio files by using this emoji. This is useful when you need to do text-to-speech conversion for applications like Microsoft PowerPoint, in which you need one audio file per slide.

The following is an example of how to construct a piece of text for processing by the TTS engine.

```text
Pronounce the following as individual numbers instead 
of a numerical value: 🔢🏁1234🔢🔚

Pronounce individual letters instead of as a word: 
🔠🏁ABCD🔠🔚

The text from here onwards
✂️
Will be placed in a different file

Add different amount of delays to your text to 
speech:

Basically no delay between here 🕛 and here

A very weak delay between here 🕐 and here

A weak delay between here 🕑 and here

A medium delay between here 🕒 and here

A strong delay between here 🕓 and here

A very strong delay between here 🕔 and here

🐢🏁The speech enclosed by these characters 
is slower than usual, by -5%🐢🔚

🚀🏁This speech is faster than usual by +5%🚀🔚
```

You can use the buttons on the software to insert these emojis.

## Support and Contact

Having trouble with Keynoter? Don't hesitate to open an Issue on Github [here](https://github.com/d3lta-v/keynoter/issues).
