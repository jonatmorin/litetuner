/**
 * The following 4 functions were taken from this repo : 
 * https://github.com/cwilso/PitchDetect 
 */

export function noteFromPitch( frequency ) {
	var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
	return Math.round( noteNum ) + 69;
}

export function frequencyFromNoteNumber( note ) {
	return 440 * Math.pow(2,(note-69)/12);
}

export function centsOffFromPitch( frequency, note ) {
	return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
}

export function getStringFromNote(note) {
    var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return noteStrings[note%12];
}

/**
* Source : https://alexanderell.is/posts/tuner/tuner.js
* @param {*} buffer the fftsize of an audioContext element
* @param {*} sampleRate the sample rate
* @returns the current pitch in hz
*/
export function autoCorrelate(buffer, sampleRate) {
   // Perform a quick root-mean-square to see if we have enough signal
   var SIZE = buffer.length;
   var sumOfSquares = 0;
   for (var i = 0; i < SIZE; i++) {
       var val = buffer[i];
       sumOfSquares += val * val;
   }
   
   var rootMeanSquare = Math.sqrt(sumOfSquares / SIZE)

   //The minMeanValue was 0.01 in the original code. 
   const minMeanValue  = 0.001;

   if (rootMeanSquare < minMeanValue) {
       return -1;
   }

   // Find a range in the buffer where the values are below a given threshold.
   var r1 = 0;
   var r2 = SIZE - 1;
   var threshold = 0.2;

   // Walk up for r1
   for (var i = 0; i < SIZE / 2; i++) {
   if (Math.abs(buffer[i]) < threshold) {
       r1 = i;
       break;
   }
   }

   // Walk down for r2
   for (var i = 1; i < SIZE / 2; i++) {
   if (Math.abs(buffer[SIZE - i]) < threshold) {
       r2 = SIZE - i;
       break;
   }
   }

   // Trim the buffer to these ranges and update SIZE.
   buffer = buffer.slice(r1, r2);
   SIZE = buffer.length

   // Create a new array of the sums of offsets to do the autocorrelation
   var c = new Array(SIZE).fill(0);
   // For each potential offset, calculate the sum of each buffer value times its offset value
   for (let i = 0; i < SIZE; i++) {
   for (let j = 0; j < SIZE - i; j++) {
       c[i] = c[i] + buffer[j] * buffer[j+i]
   }
   }

   // Find the last index where that value is greater than the next one (the dip)
   var d = 0;
   while (c[d] > c[d+1]) {
   d++;
   }

   // Iterate from that index through the end and find the maximum sum
   var maxValue = -1;
   var maxIndex = -1;
   for (var i = d; i < SIZE; i++) {
   if (c[i] > maxValue) {
       maxValue = c[i];
       maxIndex = i;
   }
   }

   var T0 = maxIndex;

   var x1 = c[T0 - 1];
   var x2 = c[T0];
   var x3 = c[T0 + 1]

   var a = (x1 + x3 - 2 * x2) / 2;
   var b = (x3 - x1) / 2
   if (a) {
   T0 = T0 - b / (2 * a);
   }

   return sampleRate/T0;
}