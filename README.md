#Ninpp Ortcoi

Ortcoi stands for 'Orator Replay That Circulate On Internet' and is an application that's manage the contents produced by [Ninpp](https://github.com/neoPix/ninpp).

##What it does
When you record yourself using Ninpp you get a '.npf' file containning the video and/or audio you recorded, your presentation and an history of when you did some actions (next slide, next annimation etc...).

Ortcoi just converts the video/audio to fit the HTML5 standards and create a presentation that can then be published on internet. You can see some example of it [here](http://ninpp.balandavid.com/Ortcoi/demo).

##How to use ?

Clone the repository, then play this set of commands :

`````
cd {dir}/ortcoi
npm install
node server.js
`````
And your good to go. The default url to connect to using your browser is : 'localhost:8080'

##video codecs

* H264
* Webm
* Theora

##Audio codecs

* Vorbis
* Mp3

##Using
* [ffmpeg](http://ffmpeg.org/legal.html)

##todo

* Refactoriring the **Ortcoi** server code  for executing the process without creating an http server.
* Propose an online service for presentation preparation.
* Create a **Ortcoi** installation and utilisation documentation.

##Tested on

* Chromium 37+
* Firefox 30+
* NodeJS v0.10.33
* Ubuntu 14.04