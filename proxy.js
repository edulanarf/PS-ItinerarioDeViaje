// server.js
// en terminal: node proxy.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send("URL requerida");

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Error al descargar imagen");

    const contentType = response.headers.get('content-type');
    const buffer = await response.buffer();

    res.set('Content-Type', contentType);
    res.send(buffer);
  } catch (err) {
    res.status(500).send("Error al procesar la imagen");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor proxy corriendo en puerto ${PORT}`));
