const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Importa CORS

const app = express();
const PORT = 3000;

// Configura CORS para permitir solicitudes desde el puerto 5500
app.use(cors({
  origin: 'http://127.0.0.1:5500'
}));

app.use(express.json());
app.use(express.static('public'));

// Configura la base de datos SQLite
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
  } else {
    console.log('Conexión a la base de datos SQLite exitosa');
    db.run(`CREATE TABLE IF NOT EXISTS Cuenta (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Nombre TEXT,
      Apellido TEXT,
      Email TEXT,
      ID_Plan INTEGER,
      Fecha_Registro DATE
    )`, (err) => {
      if (err) {
        console.error('Error al crear la tabla Cuenta:', err.message);
      } else {
        console.log('Tabla Cuenta creada o existente.');
      }
    });
  }
});

// Ruta para registrar un nuevo usuario
app.post('/register', (req, res) => {
  const { nombre, apellido, correo, plan } = req.body;
  const fecha_registro = new Date().toISOString().split('T')[0];
  let planID;

  console.log('Datos recibidos en /register:', { nombre, apellido, correo, plan });

  switch (plan) {
    case 'basico':
      planID = 1;
      break;
    case 'estandar':
      planID = 2;
      break;
    case 'premium':
      planID = 3;
      break;
    default:
      return res.json({ success: false, message: 'Plan no válido' });
  }

  const query = `INSERT INTO Cuenta (Nombre, Apellido, Email, ID_Plan, Fecha_Registro) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [nombre, apellido, correo, planID, fecha_registro], function(err) {
    if (err) {
      console.error('Error al insertar en la tabla Cuenta:', err.message);
      res.json({ success: false, message: 'Error en el registro: ' + err.message });
    } else {
      console.log('Registro exitoso. ID de la fila insertada:', this.lastID);
      res.json({ success: true });
    }
  });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { nombre } = req.body;
  const query = `SELECT * FROM Cuenta WHERE Nombre = ?`;
  db.get(query, [nombre], (err, row) => {
    if (err) {
      res.json({ success: false, message: 'Error en la consulta: ' + err.message });
    } else if (row) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Usuario incorrecto' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Ruta para obtener todas las películas con sus carátulas
app.get('/api/peliculas', (req, res) => {
  const query = `
      SELECT Pelicula.ID, Pelicula.Nombre, Pelicula.Genero, Caratula.URL_Caratula
      FROM Pelicula
      JOIN Caratula ON Pelicula.ID = Caratula.ID_Pelicula
  `;
  
  db.all(query, [], (err, rows) => {
      if (err) {
          console.error('Error al obtener películas:', err.message);
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows); // Devuelve el resultado como un array de objetos JSON
      }
  });
});

