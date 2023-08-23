const API_BASE_URL = 'https://api.openai.com/v1';
const API_KEY = '';
const GPT_MODEL = 'gpt-3.5-turbo';

const loader = document.querySelector('.loader');
const genre = document.querySelectorAll('.genre');
const placeholder = document.querySelector('#placeholder');
const stage = document.querySelector('#stage');
const gameover = document.querySelector('#gameover');

const completeChat = [];

let selectedGenre;

genre.forEach(function (button) {
  button.addEventListener('click', function () {
    selectedGenre = button.dataset.genre;
    console.log(selectedGenre);

    startGame();
  });
});

function startGame() {
  document.body.classList.add('game-started');

  completeChat.push({
    role: `system`, 
    content: `Voglio che ti comporti come se fossi un classico gioco di avventura testuale. Io sarò il protagonista e giocatore principale. Non fare riferimento a te stesso. L\'ambientazione di questo gioco sarà a tema ${selectedGenre}. Ogni ambientazione ha una descrizione di 150 caratteri seguita da una array di 3 azioni possibili che il giocatore può compiere. Una di queste azioni è mortale e termina il gioco. Non aggiungere mai altre spiegazioni. Non fare riferimento a te stesso. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description":"descrizione ambientazione","actions":["azione 1", "azione 2", "azione 3"]}###`
  });

  setStage();
}

async function setStage() {
  placeholder.innerHTML = '';

  loader.classList.remove('dnone');

  const gptResponse = await makeRequest('/chat/completions', {
    temperature: 0.9,
    model: GPT_MODEL,
    messages: completeChat
  });

  loader.classList.add('dnone');

  const message = gptResponse.choices[0].message;
  completeChat.push(message);

console.log(message.content); 
//needed this to check the result message 

const messageContent = message.content.replace(/###/, '');
const content = JSON.parse(messageContent);
const description = content.description;
const actions = content.actions;
console.log(actions);
console.log(description);

  if (actions.length === 0) {
    setGameOver(description);
  } else {
    setStageDescription(description);
    await setStagePicture(description);
    setStageActions(actions);
  }
}

async function makeRequest(endpoint, payload) {
  const url = API_BASE_URL + endpoint;

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    }
  });

  const jsonResponse = await response.json();
  return jsonResponse;
}

function setStageDescription(description) {
  const stageElement = stage.content.cloneNode(true);
  stageElement.querySelector('.description').innerText = description;
  placeholder.appendChild(stageElement);
}

async function setStagePicture(description) {
  const generatedImage = await makeRequest('/images/generations', {
    n: 1,
    size: '512x512',
    response_format: 'url',
    prompt: `questa è una storia basata su ${selectedGenre}. ${description}`
  });

  const imageUrl = generatedImage.data[0].url;
  const image = `<img alt="${description}" src="${imageUrl}">`;
  document.querySelector('.picture').innerHTML = image;
}

function setStageActions(actions) {
  let actionsHTML = '';
  actions.forEach(function (action) {
    actionsHTML += `<button>${action}</button>`;
  });

  document.querySelector('.actions').innerHTML = actionsHTML;

  const actionButtons = document.querySelectorAll('.actions button');

  actionButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const selectedAction = button.innerText;
      completeChat.push({
        role: `user`,
        content: `${selectedAction}. Se questa azione è mortale l'elenco delle azioni è vuoto. Non dare altro testo che non sia un oggetto JSON. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description": "sei morto per questa motivazione", "actions": []}###`
      });
      setStage();
    })
  });
}

function setGameOver(description) {
  const gameoverElement = gameover.content.cloneNode(true);

  gameoverElement.querySelector('.message').innerText = description;
  placeholder.appendChild(gameoverElement);

  const replayButton = document.querySelector('.gameover > button');
  replayButton.addEventListener('click', function () {
    window.location.reload();
  })
}
