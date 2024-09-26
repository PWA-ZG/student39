//source https://gist.github.com/tatsuyasusukida/b6daa0cd09bba2fbbf6289c58777eeca#file-audio-recorder-js

import {
    get,
    set,
} from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm";

async function main () {
    try {
      const buttonStart = document.querySelector('#buttonStart')
      const buttonStop = document.querySelector('#buttonStop')
      const audio = document.querySelector('#audio')
      const audioName = document.getElementById("audioName");
      const buttonUpload = document.getElementById("btnUpload")

      const stream = await navigator.mediaDevices.getUserMedia({ // <1>
        video: false,
        audio: true,
      })
  
      const [track] = stream.getAudioTracks()
      const settings = track.getSettings() // <2>
  
      const audioContext = new AudioContext() 
      await audioContext.audioWorklet.addModule('audio-recorder.js') // <3>
  
      const mediaStreamSource = audioContext.createMediaStreamSource(stream) // <4>
      const audioRecorder = new AudioWorkletNode(audioContext, 'audio-recorder') // <5>
      const buffers = []
      let blob = null
  
      audioRecorder.port.addEventListener('message', event => { // <6>
        buffers.push(event.data.buffer)
      })
      audioRecorder.port.start() // <7>
  
      mediaStreamSource.connect(audioRecorder) // <8>
      audioRecorder.connect(audioContext.destination)
  
      buttonStart.addEventListener('click', event => {
        buttonStart.setAttribute('disabled', 'disabled')
        buttonUpload.setAttribute('disabled', 'disabled')
        buttonStop.removeAttribute('disabled')
  
        const parameter = audioRecorder.parameters.get('isRecording')
        parameter.setValueAtTime(1, audioContext.currentTime) // <9>
  
        buffers.splice(0, buffers.length)
      })
  
      buttonStop.addEventListener('click', event => {
        buttonStop.setAttribute('disabled', 'disabled')
        buttonStart.removeAttribute('disabled')
        buttonUpload.removeAttribute('disabled')
  
        const parameter = audioRecorder.parameters.get('isRecording')
        parameter.setValueAtTime(0, audioContext.currentTime) // <10>
  
        blob = encodeAudio(buffers, settings) // <11>
        const url = URL.createObjectURL(blob)
        audio.src = url
      })

      buttonUpload.addEventListener("click", event => {
            buttonUpload.setAttribute('disabled', 'disabled')
            event.preventDefault();
            if (!audioName.value.trim()) {
                alert("Enter audio name!");
                buttonUpload.removeAttribute('disabled')
                return false;
            }
            if ("serviceWorker" in navigator && "SyncManager" in window) {
                console.log("Starting sync...")
                let ts = new Date().toISOString();
                let id = ts + audioName.value.replace(/\s/g, '_');
                set(id, {
                    id,
                    ts,
                    title: audioName.value,
                    audio: blob
                });
                navigator.serviceWorker.ready.then((swRegistration) => {swRegistration.sync.register(
                    "sync-audio"
                );})
                console.log("Queued for sync");
            } else {
                alert("Vaš preglednik ne podržava bckg sync...");
            }
        });


    } catch (err) {
      console.error(err)
    }
  }
  
  main()