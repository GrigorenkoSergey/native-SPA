import "./components/button-with-counter"
import "./components/my-app";

import javascriptLogo from '/javascript.svg'
import viteLogo from '/vite.svg'

document.querySelector('#app').innerHTML = `
  <my-app
    vite-logo=${viteLogo} 
    js-logo=${javascriptLogo}
  >
    <button-with-counter></button-with-counter>
  </my-app>
  `;
