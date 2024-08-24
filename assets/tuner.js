import { centsOffFromPitch, noteFromPitch, getStringFromNote, autoCorrelate } from "./tuner-utils.js";

class GuitarTuner extends HTMLElement {
    constructor() {
        super();

        this.powerBtn = this.querySelector('#powerButton');
        this.powerBtn.addEventListener('click', ()=> {
            this.powerToggle();
        })

        //Create an audio context
        this.audioCtx = new (window.AudioContext);
        window.audioCtx = this.audioCtx;
        this.analyserNode = this.audioCtx.createAnalyser();
        this.microphoneStream;
        this.audioData = new Float32Array(this.analyserNode.fftSize);
        this.toggleAudioContext();
    }

    powerToggle() {
        let currentState = this.dataset.power;
        this.toggleAudioContext();

        if (currentState === "false") {
            this.turnOn();
        } else {
            this.turnOff();
        }
    }

    turnOn() {
        this.dataset.power = "true";
        
        //Enable pitch detection
        this.startPitchDetection();

        //turn on pitch screen
        this.querySelector('.pitch').classList.add('active');
    }

    turnOff() {
        this.dataset.power = "false";

        //turn off pitch screen
        this.querySelector('.pitch').classList.remove('active');

    }

    toggleAudioContext() {
        if (this.audioCtx.state === "running") {
            this.audioCtx.suspend();
          } else if (this.audioCtx.state === "suspended") {
            this.audioCtx.resume()
          }
    }

    startPitchDetection() {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        }).then((stream) => {
            this.microphoneStream = this.audioCtx.createMediaStreamSource(stream);
            this.microphoneStream.connect(this.analyserNode);

            setInterval(() => {
               this.analyserNode.getFloatTimeDomainData(this.audioData);

               let pitch = autoCorrelate(this.audioData, this.audioCtx.sampleRate);
               let noteAsInt = noteFromPitch(pitch);

               this.displayCurrentPitch(pitch);
               this.displayCurrentNote(noteAsInt);
               this.showTuningAccuracy(pitch, noteAsInt);
            
            }, 300)

    }).catch((err) => {
            console.log(err)
        })
    }

    showTuningAccuracy(pitch, noteAsInt) {
        let detune = centsOffFromPitch(pitch, noteAsInt);
        const detuneTolerance = 5;

        const ledFlat = this.querySelector('.led__flat');
        const ledSharp = this.querySelector('.led__sharp');
        const ledAccurate = this.querySelector('.led__accurate');

        console.log(detune);

        if (detune !== NaN) {
            if (detune < -1 * detuneTolerance) {
                //flat
                ledFlat.classList.add('active');
                ledSharp.classList.remove('active');
                ledAccurate.classList.remove('active');
            }

            if (detune > -1 * detuneTolerance && detune < detuneTolerance) {
                //accurate
                ledFlat.classList.remove('active');
                ledSharp.classList.remove('active');
                ledAccurate.classList.add('active');
            }

            if (detune > detuneTolerance) {
                //sharp
                ledFlat.classList.remove('active');
                ledSharp.classList.add('active');
                ledAccurate.classList.remove('active');
            }

        }
    }

    displayCurrentNote(noteAsInt) {
        const noteContainer = this.querySelector('#note');
        
        let noteString = getStringFromNote(noteAsInt);
        
        if (noteString) {
            noteContainer.innerHTML = noteString;
        }
    }

    displayCurrentPitch(rawPitch) {
        let pitch = Math.round(rawPitch);
        const pitchContainer = this.querySelector('#pitch');

        if (pitch === -1) {
            pitchContainer.innerHTML = '--';
            return;
        }

        pitchContainer.innerHTML = pitch;
    }

    
}
customElements.define('guitar-tuner', GuitarTuner);