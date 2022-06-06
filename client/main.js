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
