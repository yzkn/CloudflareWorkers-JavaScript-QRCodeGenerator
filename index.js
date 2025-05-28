const QRCode = require("qrcode-svg");

// SVG to PNG
import { svg2png, initialize } from 'svg2png-wasm';
import wasm from "svg2png-wasm/svg2png_wasm_bg.wasm";
await initialize(wasm);


const generateAscii = async content => {
  const qr = new QRCode({ content: content || 'https://vnl.pages.dev/' })
  var modules = qr.qrcode.modules;

  var ascii = '';
  var length = modules.length;
  for (var y = 0; y < length; y++) {
    for (var x = 0; x < length; x++) {
      var module = modules[x][y];
      ascii += (module ? 'x' : ' ');
    }
    ascii += '\r\n';
  }
  return new Response(ascii, { headers: { 'Content-Type': 'text/plain' } })
}

const generatePng = async content => {
  // SVG
  const svg = new QRCode({ content: content || 'https://vnl.pages.dev/' }).svg()
  // return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } })

  // SVG to PNG
  const png = await svg2png(
    svg,
    {
      backgroundColor: 'white',
    });

  // Return
  return new Response(png, { headers: { 'Content-Type': 'image/png' } })
}

const generateSvg = async content => {
  const qr = new QRCode({ content: content || 'https://vnl.pages.dev/' })
  return new Response(qr.svg(), { headers: { 'Content-Type': 'image/svg+xml' } })
}

const landing = `
<input type="text" id="text" value="https://vnl.pages.dev/"></input>
<button onclick='generate()'>Generate QR Code</button>
<img id="qr"></img>
<script>
  function generate() {
    fetch(window.location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: document.querySelector("#text").value })
    })
    .then(response => response.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onloadend = function () {
        document.querySelector("#qr").src = reader.result;
      }
      reader.readAsDataURL(blob);
    })
  }
</script>
`

export default {
  fetch: async (request, env) => {
    let content = '';

    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname.split('/')[1] ?? '';
    const searchParams = url.searchParams;


    let response
    if (method === 'POST') {
      try {
        const json = await request.json()
        content = json.text;
      } catch (error) {
        content = ''
      }

      if (path == 'ascii') {
        response = await generateAscii(content);
      } else if (path == 'png') {
        response = await generatePng(content);
      } else {
        response = await generateSvg(content);
      }
    } else if (method === 'GET') {
      if (searchParams.has('text')) {
        content = searchParams.get('text')
      }

      if (path == '') {
        response = new Response(landing, { headers: { 'Content-Type': 'text/html' } })
      } else if (path == 'ascii') {
        response = await generateAscii(content);
      } else if (path == 'png') {
        response = await generatePng(content);
      } else if (path == 'svg') {
        response = await generateSvg(content);
      }
    }
    return response
  }
}
