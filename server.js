const express = require('express');
const next = require('next');

// Define si estás en modo desarrollo
const dev = process.env.NODE_ENV !== 'production';
const appNext = next({ dev });
const handle = appNext.getRequestHandler();

// Inicializar la aplicación Express
const app = express();

// Preparar Next.js
appNext.prepare().then(() => {
  // Redirigir todo el tráfico a Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Usar el puerto de la variable de entorno o 3000 por defecto
  const port = process.env.PORT || 3000;
  
  app.listen(port, (err) => {
    if (err) {
      console.error('Error al iniciar el servidor:', err);
      return;
    }
    console.log(`Servidor corriendo en puerto ${port}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('Error durante la preparación de Next.js:', err);
});