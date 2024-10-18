function populateVoiceList() {
  if (typeof speechSynthesis === 'undefined') {
    return;
  }

  var voices = speechSynthesis.getVoices();
  var voiceSelect = document.getElementById('voice');

  voiceSelect.innerHTML = '';

  var groupedVoices = voices.reduce((acc, voice) => {
    var lang = voice.lang;
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(voice);
    return acc;
  }, {});

  for (var lang in groupedVoices) {
    var optgroup = document.createElement('optgroup');
    optgroup.label = lang;
    groupedVoices[lang].forEach(voice => {
      var option = document.createElement('option');
      option.textContent = voice.name + ' (' + voice.lang + ')';
      option.setAttribute('data-lang', voice.lang);
      option.setAttribute('data-name', voice.name);
      optgroup.appendChild(option);
    });
    voiceSelect.appendChild(optgroup);
  }
}

populateVoiceList();
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}


function startRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Your browser doesn't support the Web Speech API. Please use Google Chrome.");
    return;
  }

  var recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = function(event) {
    var interimTranscript = '';
    var finalTranscript = '';
    for (var i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    document.getElementById('speech-bubble').innerText = interimTranscript;
    document.getElementById('result').innerText = finalTranscript;
  };

  recognition.onerror = function(event) {
    alert('Error occurred in recognition: ' + event.error);
  };

  recognition.onend = function() {
    document.getElementById('speech-bubble').style.display = 'none';
  };

  document.getElementById('speech-bubble').style.display = 'block';
  recognition.start();
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
    alert("No text to speak. Please recognize or type some text first.");
    return;
  }

  utterance = new SpeechSynthesisUtterance(textToSpeak);

  var pitch = document.getElementById('pitch').value;
  var rate = document.getElementById('rate').value;
  var voiceSelect = document.getElementById('voice');
  var selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');

  utterance.pitch = parseFloat(pitch);
  utterance.rate = parseFloat(rate);

  var voices = speechSynthesis.getVoices();
  utterance.voice = voices.find(voice => voice.name === selectedOption);

  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if (utterance) {
    speechSynthesis.cancel();
  }
}

function pauseSpeech() {
  if (utterance) {
    speechSynthesis.pause();
  }
}

function resumeSpeech() {
  if (utterance) {
    speechSynthesis.resume();
  }
}
