document.getElementById('start').addEventListener('click', startPlaying);

const twinkleNotes = [
    'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',
    'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4',
    'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
    'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
    'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',
    'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'
];

let correctCount = 0;
let incorrectCount = 0;
let currentNoteIndex = 0;

const sampleRate = 44100;
const dataSize = 1024;
const windowType = 'hann';
const detector = new NoteDetector(dataSize, sampleRate, windowType);

let audioContext, analyser, microphone, dataArray;

async function startPlaying() {
    correctCount = 0;
    incorrectCount = 0;
    currentNoteIndex = 0;
    document.getElementById('correct').innerText = correctCount;
    document.getElementById('incorrect').innerText = incorrectCount;
    document.getElementById('result').innerText = '';

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = dataSize;
        dataArray = new Float32Array(analyser.fftSize);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
        } catch (err) {
            console.error('Error accessing the microphone', err);
            return;
        }
    }

    detectPitch();
}

function detectPitch() {
    if (currentNoteIndex >= twinkleNotes.length) {
        document.getElementById('result').innerText = "Song Completed!";
        return;
    }

    analyser.getFloatTimeDomainData(dataArray);
    detector.update(dataArray);
    const note = detector.getNote();

    if (note) {
        const detectedFreq = note.freq;
        const consensusFreq = note.freq;
        const expectedFreq = noteToHz(noteStringToNoteNumber(twinkleNotes[currentNoteIndex]));

        if (Math.abs(consensusFreq - expectedFreq) < detector.conf.close_threshold) {
            correctCount++;
            document.getElementById('correct').innerText = correctCount;
        } else {
            incorrectCount++;
            document.getElementById('incorrect').innerText = incorrectCount;
        }

        currentNoteIndex++;
        document.getElementById('result').innerText += `Est: ${detectedFreq.toFixed(2)}, Expected: ${expectedFreq.toFixed(2)}\n`;
    }

    requestAnimationFrame(detectPitch);
}

function noteStringToNoteNumber(note) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = parseInt(note[note.length - 1], 10);
    const letter = note.slice(0, -1);
    const noteNumber = notes.indexOf(letter) + (octave + 1) * 12;
    return noteNumber;
}

function noteToHz(note) {
    return 440 * Math.pow(2, (note - 49) / 12);
}
