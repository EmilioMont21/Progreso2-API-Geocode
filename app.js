const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');

const app = express();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'geocodep2'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
  } else {
    console.log('Conexión a MySQL establecida correctamente');
  }
});


app.get('/usuarios', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err);
      res.status(500).send('Error al obtener usuarios de la base de datos');
    } else {
      res.json(results);
    }
  });
});

app.get('/citys', (req, res) => {
  connection.query('SELECT * FROM citys', (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err);
      res.status(500).send('Error al obtener las ciudades de la base de datos');
    } else {
      res.json(results);
    }
  });
});


app.get('/usuarios/:user', async (req, res) => {
  const user = req.params.user;

  const sql = 'SELECT * FROM geocodep2.users WHERE user = ?';

  connection.query(sql, [user], async (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err);
      res.status(500).send('Error al obtener usuarios de la base de datos');
    } else {
      if (results.length > 0) {

        const usuario = results[0];

        try {
          const city = usuario.city;

          const apiData = await getCity(city);

          res.json(apiData)

          if(apiData){

            const insertQ = 'INSERT INTO geocodep2.citys (name, prov, country) VALUES (?, ?, ?)';
            const insertV = [apiData.standard.city, apiData.standard.prov, apiData.standard.countryname];

            connection.query(insertQ, insertV, (insertError) => {
              if (insertError) {
                console.error('Error al insertar datos en la tabla citys:', insertError);
              } else {
                console.log('Datos de la ciudad insertados correctamente en la tabla citys');
              }
            });
          }

        } catch (error) {
          console.error('Error al obtener datos de geocodificación:', error);
          res.status(500).send('Error al obtener datos de geocodificación');
        }
      } else {
        res.status(404).send('Usuario no encontrado');
      }
    }
  });
});

process.on('exit', () => {
  connection.end();
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor Express iniciado en el puerto ${PORT}`);
});



async function getCity(city) {
  
  const url = `https://geocode.xyz/${city}?json=1&auth=527081218779127454483x79721 `;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
}