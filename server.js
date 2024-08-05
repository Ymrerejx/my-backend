// index.js

const express = require('express');
const mariadb = require('mariadb');

const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Port sur lequel le serveur écoutera

// Configuration de body-parser pour lire les données JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let pool;
let conn;
async function handleDisconnect() {
  pool = mariadb.createPool({
    host: 'localhost',  // Remplacez par l'adresse de votre serveur MariaDB
    user: 'phpmyadmin',  // Remplacez par votre nom d'utilisateur
    password: '149999',  // Remplacez par votre mot de passe
    connectionLimit: 5
  });

  let conn;
  try {
    conn = await pool.getConnection();
    console.log("Connecté à la base de données MariaDB !");
    // Faites des requêtes ici
  } catch (err) {
    console.error("Erreur lors de la connexion à MariaDB:", err);
  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
}

handleDisconnect();

// Exemple de route pour récupérer des utilisateurs
app.get('/days', async (req, res) => {
  
  try {
    const rows = await conn.query("SELECT * FROM Day"); // Remplacez par votre requête SQL
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la récupération de la table DAY');
  } finally {
    if (conn) conn.release();
  }
});

/*
// Exemple de route pour ajouter un utilisateur
app.post('/addDay', (req, res) => {
  const { rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate } = req.body;
  conn.query('INSERT INTO Day (Rating, Reading, Piano, Skin, Sleep, Description, Fap, Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de l\'ajout d un day');
    } else {
      res.status(200).send('day ajouté avec succès');
      console.log("Succes : addDay")
    }
  });
});

// Exemple de route pour ajouter un utilisateur
app.post('/addSport', (req, res) => {
  const { currentSportSelection, currentDate } = req.body;
  conn.query('INSERT INTO Sport (Activity, Date) VALUES (?, ?)', [ currentSportSelection, currentDate], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de l\'ajout d un day');
    } else {
      res.status(200).send('sport ajouté avec succès');
      console.log("Succes : addSport")
    }
  });
});

// Exemple de route pour ajouter un utilisateur
app.post('/getSport', (req, res) => {
  const { currentDate } = req.body;
  conn.query('SELECT * FROM `Sport` WHERE Date = "' + currentDate+  '";', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de la récupération des sports du jour');
    } else {
      res.status(200).send(result);
      console.log("Succes : getSport")
    }
  });
});

// Exemple de route pour ajouter un utilisateur
app.post('/removeSport', (req, res) => {
  const { sportId } = req.body;
  console.log("ok remove");

  conn.query('DELETE FROM Sport WHERE Id = "' + sportId+  '";', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de la suppression d\'un sports du jour');
    } else {
      res.status(200).send(result);
      console.log("Succes : removeSport")
    }
  });
});

// Exemple de route pour ajouter un utilisateur
app.post('/getToday', (req, res) => {
  const { currentDate } = req.body;
  conn.query('SELECT Sport.Id, Day.Rating, Day.Piano, Day.Skin, Day.Sleep, Day.Reading, Day.Description, Day.Fap, Sport.Activity, Day.Date FROM Day LEFT JOIN Sport ON Day.Date = Sport.Date WHERE Day.Date = "' + currentDate+  '";', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de la récupération du jour ' + currentDate);
    } else {
      res.status(200).json(result);
      console.log("Succes : getToday")
    }
  });
});

// Exemple de route pour ajouter un utilisateur
app.post('/getAlert', (req, res) => {
  const { currentDate } = req.body;
  // Sport / Routine reading
  let dayWithoutSport = -1;
  let needSportCount = true;

  // Alert piano
  let dayWithoutPiano = -1;
  let needPianoCount = true;

  // Alert skin
  let dayWithoutSkin = -1;
  let needSkinCount = true;

  // Alert reading
  let dayWithoutReading = -1;
  let needReadingCount = true;

  //Alert Fap
  let dayWithoutFap = -1;
  let lastFap = "";
  let needFapCount = true;

  conn.query('SELECT * FROM Day ORDER BY Date DESC;', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de la récupération du jour ' + currentDate);
    } else {

      
    result.forEach(element => {
      //Piano
      if(needPianoCount)
      {
        dayWithoutPiano++;
      }
      if(element.Piano != false && needPianoCount)
      {
        needPianoCount = false;
      }

      //Skin
      if(needSkinCount)
      {
        dayWithoutSkin++;
      }
      if(element.Skin != false && needSkinCount)
      {
        needSkinCount = false;
      }

      //Reading
      if(needReadingCount)
      {
        dayWithoutReading++;
      }
      if(element.Reading != false && needReadingCount)
      {
        needReadingCount = false;
      }

      // Fap
      if(needFapCount)
      {
        dayWithoutFap++;
      }
      
      if(element.Fap != "Pure" && needFapCount)
      {
        lastFap = element.Fap;
        needFapCount = false;
      }

    });

    conn.query('SELECT Sport.Activity, Day.Date FROM Day LEFT JOIN Sport ON Day.Date = Sport.Date ORDER by Day.Date DESC;', (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send('Erreur lors de la récupération du jour ' + currentDate);
      } else {
        let date = "";
        let dateOk = false;
        result.forEach(element => {

          if(date != element.Date)
          {
            date = element.Date;
            dateOk = false;
          }
          
          // Sport
          if(needSportCount && !dateOk)
          {
            dayWithoutSport++;
          }
          if(element.Activity != null && needSportCount)
          {
            needSportCount = false;
          }
        });

        const resultsAlert = [{dayWithoutSport,dayWithoutPiano, dayWithoutSkin, dayWithoutReading, dayWithoutFap, lastFap}];
        res.status(200).json(resultsAlert);
        console.log("Succes : getAlert");
      }
    });

    
    }
  });
});

// Exemple de route pour ajouter un utilisateur
app.post('/updateToday', (req, res) => {
  const {rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate } = req.body;
  conn.query('UPDATE Day SET Skin = '+skinChecked+', Piano = '+pianoChecked+', Sleep = "'+sleepValue+'", Reading = '+readingChecked+', Rating = "'+rating+'", Description = "'+ Description+'", Fap = "'+Fap+'" WHERE Date = "'+currentDate+'";', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de l\'update Today' + currentDate);
    } else {
      res.status(200).json(result);
      console.log("Succes : updateToday")
    }
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur backend écoutant sur le port ${port}`);
});*/