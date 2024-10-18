document.addEventListener('DOMContentLoaded', function() {
    const stepsSlider = document.getElementById('steps-slider');
    const stepsValue = document.getElementById('steps-value');
    const processAudioButton = document.getElementById('process-audio-button');
    const downloadModulatedFileButton = document.getElementById('download-modulated-file');
    const audioOutput = document.getElementById('audio-output');

    stepsSlider.addEventListener('input', function() {
        stepsValue.textContent = stepsSlider.value;
    });

    processAudioButton.addEventListener('click', function() {
        const nSteps = parseInt(stepsSlider.value, 10);

        fetch(`/pitch-shift?n_steps=${nSteps}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                audioOutput.textContent = data.message;
                downloadModulatedFileButton.style.display = 'block';
                downloadModulatedFileButton.href = data.file;
            } else {
                audioOutput.textContent = data.error || 'Failed to process audio.';
            }
        })
        .catch(error => {
            audioOutput.textContent = 'Error processing audio: ' + error;
            console.error('Error:', error);
        });
    });

    downloadModulatedFileButton.addEventListener('click', function() {
        window.location.href = '/download-processed-audio';
    });
});




document.addEventListener('DOMContentLoaded', function() {
    const generateKeyButton = document.getElementById('generate-key-button');
    const downloadLink = document.getElementById('download-key');
    const errorMessage = document.getElementById('error-message');

    generateKeyButton.addEventListener('click', function() {
        fetch('/generate-key', { method: 'GET' }) // Changed to GET
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Key generated successfully') {
                    downloadLink.href = '/download-key';
                    downloadLink.style.display = 'block';
                    downloadLink.click();
                    errorMessage.style.display = 'none'; 
                } else {
                    errorMessage.textContent = data.error || 'Failed to generate key.';
                    errorMessage.style.display = 'block';
                }
            })
            .catch(error => {
                errorMessage.textContent = 'Error generating key: ' + error;
                errorMessage.style.display = 'block';
                console.error('Error:', error);
            });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const encryptButton = document.getElementById('process-encryption-button');
    const errorMessage = document.getElementById('error-message');
    
    encryptButton.addEventListener('click', function() {
        fetch('/encrypt-audio?action=encryption-section', { method: 'GET' })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Unknown error');
                    });
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'encrypted_audio.encrypted';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                errorMessage.style.display = 'none';
            })
            .catch(error => {
                errorMessage.textContent = 'Error encrypting audio: ' + error.message;
                errorMessage.style.display = 'block';
                console.error('Error:', error);
            });
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const decryptButton = document.getElementById('process-decryption-button');
    const errorMessage = document.getElementById('error-message');

    decryptButton.addEventListener('click', function() {
        fetch('/decrypt-audio?action=decryption-section', { method: 'GET' })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Unknown error');
                    });
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'decrypted_audio.wav';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                errorMessage.style.display = 'none';
            })
            .catch(error => {
                errorMessage.textContent = 'Error decrypting audio: ' + error.message;
                errorMessage.style.display = 'block';
                console.error('Error:', error);
            });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const processButton = document.getElementById('process-button');
    const transcriptionTextarea = document.getElementById('transcription');
    const errorMessage = document.getElementById('error-message');

    processButton.addEventListener('click', function() {
        fetch('/process-audio?action=speech_to_text')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    transcriptionTextarea.value = data.text; 
                    errorMessage.style.display = 'none'; 
                } else {
                    transcriptionTextarea.value = ''; 
                    errorMessage.textContent = data.error; 
                    errorMessage.style.display = 'block';
                }
            })
            .catch(error => {
                transcriptionTextarea.value = ''; 
                errorMessage.textContent = 'An error occurred while processing the request.';
                errorMessage.style.display = 'block';
                console.error('Error:', error);
            });
    });
});

document.getElementById('copy-button').addEventListener('click', function() {
    const transcriptionTextarea = document.getElementById('transcription');
    transcriptionTextarea.select();
    document.execCommand('copy');
});


document.getElementById('process-encryption-button').addEventListener('click', function() {
    const fileInput = document.getElementById('upload-audio');
    const keyInput = document.getElementById('upload-key');

    if (!fileInput.files.length || !keyInput.files.length) {
        alert('Please upload an audio file and an encryption key.');
        return;
    }

    const audioFile = fileInput.files[0];
    const keyFile = keyInput.files[0];
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('key', keyFile);

    fetch('/encrypt-audio', { method: 'POST', body: formData })
        .then(response => {
            if (response.ok) {
                return response.blob(); 
            } else {
                throw new Error('Failed to encrypt audio.');
            }
        })
        .then(blob => {
            const downloadLink = document.getElementById('download-encrypted-file');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'encrypted_audio.encrypted';
            downloadLink.style.display = 'block';
            downloadLink.textContent = 'Download Encrypted File';
            document.getElementById('encrypted-output').value = 'Encryption completed. File is ready for download.';
        })
        .catch(error => {
            alert('Error encrypting audio: ' + error.message);
        });
});

let recorder;
let audioStream;

const audioResample = (buffer, sampleRate) => {
    const offlineCtx = new OfflineAudioContext(2, (buffer.length / buffer.sampleRate) * sampleRate, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    return offlineCtx.startRendering();
};

const audioReduceChannels = (buffer, targetChannelOpt) => {
    if (targetChannelOpt === 'both' || buffer.numberOfChannels < 2) return buffer;
    const outBuffer = new AudioBuffer({
        sampleRate: buffer.sampleRate,
        length: buffer.length,
        numberOfChannels: 1
    });

    const data = [buffer.getChannelData(0), buffer.getChannelData(1)];
    const newData = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; ++i)
        newData[i] =
            targetChannelOpt === 'left' ? data[0][i] :
            targetChannelOpt === 'right' ? data[1][i] :
            (data[0][i] + data[1][i]) / 2;
    outBuffer.copyToChannel(newData, 0);
    return outBuffer;
};

const audioNormalize = (buffer) => {
    const data = Array.from(Array(buffer.numberOfChannels)).map((_, idx) => buffer.getChannelData(idx));
    const maxAmplitude = Math.max(...data.map(chan => chan.reduce((acc, cur) => Math.max(acc, Math.abs(cur)), 0)));
    if (maxAmplitude >= 1.0) return buffer;
    const coeff = 1.0 / maxAmplitude;
    data.forEach(chan => {
        chan.forEach((v, idx) => chan[idx] = v * coeff);
        buffer.copyToChannel(chan, 0);
    });
    return buffer;
};

const processAudioFile = async (audioBufferIn, targetChannelOpt, targetSampleRate) => {
    const resampled = await audioResample(audioBufferIn, targetSampleRate);
    const reduced = audioReduceChannels(resampled, targetChannelOpt);
    const normalized = audioNormalize(reduced);
    return normalized;
};

const audioToRawWave = (audioChannels, bytesPerSample, mixChannels = false) => {
    const bufferLength = audioChannels[0].length;
    const numberOfChannels = audioChannels.length === 1 ? 1 : 2;
    const reducedData = new Uint8Array(bufferLength * numberOfChannels * bytesPerSample);
    for (let i = 0; i < bufferLength; ++i) {
        for (let channel = 0; channel < (mixChannels ? 1 : numberOfChannels); ++channel) {
            const outputIndex = (i * numberOfChannels + channel) * bytesPerSample;
            let sample;
            if (!mixChannels) sample = audioChannels[channel][i];
            else sample = audioChannels.reduce((prv, cur) => prv + cur[i], 0) / numberOfChannels;
            sample = sample > 1 ? 1 : sample < -1 ? -1 : sample;
            switch (bytesPerSample) {
                case 2:
                    sample = sample * 32767;
                    reducedData[outputIndex] = sample;
                    reducedData[outputIndex + 1] = sample >> 8;
                    break;
                case 1:
                    reducedData[outputIndex] = (sample + 1) * 127;
                    break;
                default:
                    throw "Only 8, 16 bits per sample are supported";
            }
        }
    }
    return reducedData;
};

const makeWav = (data, channels, sampleRate, bytesPerSample) => {
    const headerLength = 44;
    var wav = new Uint8Array(headerLength + data.length);
    var view = new DataView(wav.buffer);

    view.setUint32(0, 1380533830, false); 
    view.setUint32(4, 36 + data.length, true); 
    view.setUint32(8, 1463899717, false); 
    view.setUint32(12, 1718449184, false); 
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true); 
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample * channels, true); 
    view.setUint16(32, bytesPerSample * channels, true); 
    view.setUint16(34, bytesPerSample * 8, true); 
    view.setUint32(36, 1684108385, false); 
    view.setUint32(40, data.length, true); 

    wav.set(data, headerLength);

    return new Blob([wav.buffer], { type: "audio/wav" });
};


async function startRecording() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recorder = new MediaRecorder(audioStream);
          recorder.ondataavailable = async e => {
              const audioBlob = e.data;

              
              const reader = new FileReader();
              reader.readAsArrayBuffer(audioBlob);
              reader.onloadend = async function() {
                  const arrayBuffer = reader.result;
                  const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);


                  const targetOptions = {
                      sampleRate: 44100, 
                      bytesPerSample: 2, 
                      channelOpt: 'both' 
                  };
                  const processedBuffer = await processAudioFile(audioBuffer, targetOptions.channelOpt, targetOptions.sampleRate);
                  const rawData = audioToRawWave(
                      targetOptions.channelOpt === 'both' ? [processedBuffer.getChannelData(0), processedBuffer.getChannelData(1)] : [processedBuffer.getChannelData(0)],
                      targetOptions.bytesPerSample
                  );
                  const wavBlob = makeWav(rawData, targetOptions.channelOpt === 'both' ? 2 : 1, targetOptions.sampleRate, targetOptions.bytesPerSample);

              
                  const formData = new FormData();
                  formData.append('audio', wavBlob, 'audio.wav');

                  const response = await fetch('/upload', {
                      method: 'POST',
                      body: formData
                  });

                  if (response.ok) {
                      const result = await response.json();
                      if (result.success) {
                          console.log('File uploaded successfully: ', result.filename);
                      } else {
                          alert('Failed to upload file.');
                      }
                  } else {
                      alert('Error uploading file.');
                  }

                  
                  const audio = document.getElementById('recorded-audio');
                  audio.src = URL.createObjectURL(wavBlob);
                  audio.style.display = 'block';
                  document.getElementById('audio-box').style.display = 'block';

                  const downloadLink = document.getElementById('download-link');
                  downloadLink.href = URL.createObjectURL(wavBlob);
                  downloadLink.download = 'recorded-audio.wav'; 
                  downloadLink.style.display = 'block';
              };
          };
          recorder.start();
          document.getElementById('speech-bubble').style.display = 'block';
      } catch (err) {
          alert('Error accessing the microphone: ' + err);
      }
  } else {
      alert('MediaRecorder is not supported in this browser.');
  }
}

function stopRecording() {
  if (recorder) {
      recorder.stop();
      audioStream.getAudioTracks()[0].stop();
      document.getElementById('speech-bubble').style.display = 'none';
  }
}


let utterance;

function speakText() {
  var resultText = document.getElementById('result').innerText;
  var inputText = document.getElementById('text-to-speak').value;
  
  var textToSpeak = '';

  if (inputText !== "" && resultText !== "") {
      textToSpeak = inputText + ". " + resultText;
  } else if (inputText !== "") {
      textToSpeak = inputText;
  } else if (resultText !== "") {
      textToSpeak = resultText;
  } else {
    alert("No text to speak.");
    return;
}

utterance = new SpeechSynthesisUtterance(textToSpeak);
window.speechSynthesis.speak(utterance);
}

document.getElementById('start-recording').addEventListener('click', startRecording);
document.getElementById('stop-recording').addEventListener('click', stopRecording);


document.getElementById('process-button').addEventListener('click', async () => {
  try {
    console.log('Process button clicked');
    const audioElement = document.getElementById('recorded-audio');
    if (!audioElement.src) {
      console.error('No recorded audio available.');
      return;
    }

    const audioBlob = await fetch(audioElement.src).then(res => res.blob());
    console.log('Fetched audio blob:', audioBlob);
    
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async function () {
      const audioData = reader.result.split(',')[1];
      console.log('Audio Data:', audioData);

      const formData = {
        audioData: audioData,
        action: 'speech_to_text'
      };

      const response = await fetch('/process-audio', {
        method: 'POST',
        headers: {
          'Content-Type':'apliication/json'
        },
        body: JSON.stringify({
            action: 'speech_to_text',
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          document.getElementById('transcription').innerText = result.text || '';
        } else {
          document.getElementById('error-message').innerText = result.error || 'An error occurred.';
          document.getElementById('error-message').style.display = 'block';
        }
      } else {
        throw new Error('Failed to process audio.');
      }
    };
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('error-message').innerText = 'An error occurred while processing the audio.';
    document.getElementById('error-message').style.display = 'block';
  }
});

async function downloadProcessedAudio() {
const response = await fetch('/download-processed-audio');

if (response.ok) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-audio.wav'; 
    a.click();
    URL.revokeObjectURL(url);
} else {
    alert('Failed to download processed audio.');
}
}

document.getElementById('download-processed-audio').addEventListener('click', downloadProcessedAudio);

