# Web Push Notifications

## Server

Server: seta uma key privada e pública

```js
webpush.setVapidDetails(
'mailto:test@test.com',
'BClSaUX40P-vehP9NR92FZZiMbvr-Xk4tNjq4I6nYnoGAANv_ZA6dh09dclE_umS7C-VIa5J9HhKrWDMVsWzrdI',
'3JJSASPWd5jIpMzcSJdICI4wi_QmbkbzJodGfhBZan4'
);
```
Esse email é obrigatório, mas testei com o meu email e não recebi nada, então não sei exatamente para que serve.

Teremos que ter um campo para a `subscription` para cada usuário no banco de dados que atualiza toda vez que o usuário entra na página

Por exemplo, esse é o código `subscription` gerado pelo Google Chrome:

```json
{"endpoint":"https://fcm.googleapis.com/fcm/send/dLlLAb_sipA:APA91bFXzptvbhW8oG9J44b6BtkIEDjTq8cqI7xzWAWaJNgFz9JIN8cy5HwW6mvOqAcHgpWyf5_mHmN6Bfwc0ApU9Gx1poBJAN_FrItNKjknZWHRKL5MZ77SSmgFE7ML1Vj780QdB2EH","expirationTime":null,"keys":{"p256dh":"BCvChNelKQC3DoriBdFDBxA4Y_BAfSzzxFgzo6uTitkbi8wRrH6TAwxdNnKdTKrprxyxBSFMcg_IGHjdsg_EzGA","auth":"SOGynRK9Eu2F6DJYUNsUQA"}}
```

`subscription` gerado pelo Firefox

```json
{"endpoint":"https://updates.push.services.mozilla.com/wpush/v2/gAAAAABineXHpiKhu2IdRQMtI1C2RrpYiQ2wQrsuHQlBdeBnVkfae0OCI_RKCactMNG3IEaXuEu-cMOl_X2tVJ9mFj_w-8mjzPmV2ZpJPXnDYakFT4tk-u-vwXBlHE5zMpNlD3lGDDEEnLihfkA82ZFHE2jbUlcEaQmrJGPmVWdym1Qsn1Z9UrQ","expirationTime":null,"keys":{"auth":"pEjizTzJO_2xRyPriGJxYw","p256dh":"BBNo6pF8bMubmDq3Msdha9xSvlZT6lpBLo564ASUzGN1TEvelGUgKNJ4Je544nzyCDiArJA4lZA3u55sh0pI298"}}
```
Libs de `web-push` para Node e PHP em: https://github.com/web-push-libs/

Exemplo de código usando Node

```js
const webpush =  require('web-push');
const  express  =  require("express");
const  bodyParser  =  require("body-parser");
const  path  =  require("path");

// VAPID keys should be generated only once.
// const vapidKeys = webpush.generateVAPIDKeys();
const  app  =  express();

// Set static path
app.use(express.static(path.join(__dirname, "client")));

app.use(bodyParser.json());

webpush.setVapidDetails(
'mailto:test@test.com',
'BClSaUX40P-vehP9NR92FZZiMbvr-Xk4tNjq4I6nYnoGAANv_ZA6dh09dclE_umS7C-VIa5J9HhKrWDMVsWzrdI',
'3JJSASPWd5jIpMzcSJdICI4wi_QmbkbzJodGfhBZan4'
);

// Subscribe Route
app.post("/subscribe", (req, res) => {
// Get pushSubscription object
// no nosso caso vamos usar o subscription do usuário armazenado no banco de dados
const  subscription  =  req.body;

// Send 201 - resource created
res.status(201).json({});

// Create payload to send to frontend
const  payload  =  JSON.stringify({ title:  "Push Test" });

// Pass object into sendNotification
webpush
	.sendNotification(subscription, payload)
	.catch(err  =>  console.error(err));
});

const  port  =  5000;
app.listen(port, () =>  console.log(`Server started on port ${port}`));
```

## Client

No client, no arquivo de `service worker (sw.js)`, somente temos que setar os listeners de push (disparado quando recebe uma notificação) e de click na notificação (`notificationonclick`)

Esse é o de push:

```js
self.addEventListener('push', function(event) {
	console.log('[Service Worker] Push Received.');
	// esse é o payload que vem lá do backend (JSON.stringify({ title:  "Push Test" });)
	console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

	const  title  =  'Push';

	const  options  = {
		body:  'Yay it works.',
		icon:  'images/icon.png',
		badge:  'images/badge.png'
	};

	event.waitUntil(self.registration.showNotification(title, options));
});
```
E esse é o de click:

```js
self.addEventListener('notificationclick', function(event) {
	console.log('[Service Worker] Notification click Received.');

	event.notification.close();

	// event.waitUntil(
	// clients.openWindow('https://app.tecimob.com.br')
	// );
});
```
No nosso arquivo `main.js` responsável por registrar o service worker temos este conteúdo:
```js
/*
*
*  Push Notifications codelab
*  Copyright 2015 Google Inc. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License
*
*/

/* eslint-env browser, es6 */

'use strict';

// Chave pública gerada em: https://web-push-codelab.glitch.me/
// Obviamente, em produção, não iremos usar isso, e sim uma das libs providas pelo Google 
// (https://github.com/web-push-libs/) (https://prnt.sc/aMG7l5euJsHI)
const applicationServerPublicKey = 'BClSaUX40P-vehP9NR92FZZiMbvr-Xk4tNjq4I6nYnoGAANv_ZA6dh09dclE_umS7C-VIa5J9HhKrWDMVsWzrdI';

let isSubscribed = false;
let swRegistration = null;

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Esse código verifica se service workers e mensagens push são suportados pelo 
// navegador atual e, caso sejam, ele registra nosso arquivo sw.js.
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported');

  navigator.serviceWorker.ready.then(function () {
    console.log('Hi service worker');
  });
} else {
  console.warn('Push messaging is not supported');
}

// O método updateSubscriptionOnServer é um método onde, em um aplicativo real enviaríamos nossa inscrição para um back-end; 
// porém, para o nosso teste, vamos imprimir a inscrição em nossa IU. Adicione este método a scripts/main.js:
async function updateSubscriptionOnServer(subscription) {
  // Atualiza no banco de dados a inscrição do usuário
  // A inscrição é dependente do navegador, então, o Chrome tem uma subscription diferente do edge por exemplo
  // Por isso ela precisa ser atualizada sempre
  // Para fins de teste, aqui estou mandando a request para subscribe que dispara a notificação
  await fetch('/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json'
    }
  });
  console.log('Push sent to server.');

  const subscriptionJson = document.querySelector('.js-subscription-json');
  const subscriptionDetails =
    document.querySelector('.js-subscription-details');

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    subscriptionDetails.classList.remove('is-invisible');
  } else {
    subscriptionDetails.classList.add('is-invisible');
  }
}

// Função responsável por perguntar se o usuário permite as notificações
function subscribeUser() {
  // Primeiro, tomamos a chave pública do servidor do aplicativo, que é codificada com base em URL 64 seguro, e a convertemos em um UInt8Array, 
  // pois esta é a interação esperada da chamada de inscrição. Já lhe demos a função urlB64ToUint8Array no topo de scripts/main.js.
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  // Depois de converter o valor, chamamos o método subscribe() no pushManager do nosso service worker, 
  // passando a chave pública do nosso servidor de aplicativo e o valor userVisibleOnly: true.
  swRegistration.pushManager.subscribe({
    // O parâmetro userVisibleOnly é, basicamente, uma admissão de que você vai mostrar uma notificação cada vez que um push for enviado.
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed:', subscription);

    updateSubscriptionOnServer(subscription);

    isSubscribed = true;
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
  });
}


function initialiseUI() {
  window.addEventListener('load', function() {
    // Set the initial subscription value
    // Nosso novo método usa o swRegistration da etapa anterior e chama getSubscription() em seu pushManager.
    // getSubscription() é um método que retorna uma promessa que se resolve com a inscrição atual, se houver; 
    // caso contrário, ele retorna null. Com isso, podemos verificar se o usuário já está inscrito ou não.
    swRegistration.pushManager.getSubscription()
      .then(function(subscription) {
        isSubscribed = subscription !== null;

        if (isSubscribed) {
          console.log('User IS subscribed.');
          updateSubscriptionOnServer(subscription);
        } else {
          console.log('User is NOT subscribed.');
          subscribeUser();
        }
      })
  });
}

navigator.serviceWorker.register('sw.js')
  .then(function(swReg) {
    console.log('Service Worker is registered', swReg);

    swRegistration = swReg;
    initialiseUI();
  })
```