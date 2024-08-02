// index.js

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Port sur lequel le serveur écoutera

// Configuration de body-parser pour lire les données JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let db;
function handleDisconnect() {
  db = mysql.createConnection({
    host: 'mysql-courtade.alwaysdata.net', // Remplacez par l'hôte de votre base de données
    user: 'courtade', // Remplacez par le nom d'utilisateur de votre base de données
    password: 'Courtade14##', // Remplacez par le mot de passe de votre base de données
    database: 'courtade_mydaily' // Remplacez par le nom de votre base de données
  });

  db.connect((err) => {
    if (err) {
      console.error('Erreur de connexion à la base de données:', err);
      setTimeout(handleDisconnect, 2000); // Reconnexion après 2 secondes
    } else {
      console.log('Connecté à la base de données MySQL');
    }
  });

  db.on('error', (err) => {
    console.error('Erreur de la base de données:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

// Exemple de route pour récupérer des utilisateurs
app.get('/days', (req, res) => {
  
  db.query('SELECT * FROM Day', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Erreur lors de la récupération des utilisateurs');
    } else {
      res.status(200).json(result);
      console.log("Succes : days")
    }
  });
});

// Exemple de route pour ajouter un utilisateur
app.post('/addDay', (req, res) => {
  const { rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate } = req.body;
  db.query('INSERT INTO Day (Rating, Reading, Piano, Skin, Sleep, Description, Fap, Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate], (err, result) => {
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
  db.query('INSERT INTO Sport (Activity, Date) VALUES (?, ?)', [ currentSportSelection, currentDate], (err, result) => {
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
  db.query('SELECT * FROM `Sport` WHERE Date = "' + currentDate+  '";', (err, result) => {
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

  db.query('DELETE FROM Sport WHERE Id = "' + sportId+  '";', (err, result) => {
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
  db.query('SELECT Sport.Id, Day.Rating, Day.Piano, Day.Skin, Day.Sleep, Day.Reading, Day.Description, Day.Fap, Sport.Activity, Day.Date FROM Day LEFT JOIN Sport ON Day.Date = Sport.Date WHERE Day.Date = "' + currentDate+  '";', (err, result) => {
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

  db.query('SELECT * FROM Day ORDER BY Date DESC;', (err, result) => {
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

    db.query('SELECT Sport.Activity, Day.Date FROM Day LEFT JOIN Sport ON Day.Date = Sport.Date ORDER by Day.Date DESC;', (err, result) => {
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
  db.query('UPDATE Day SET Skin = '+skinChecked+', Piano = '+pianoChecked+', Sleep = "'+sleepValue+'", Reading = '+readingChecked+', Rating = "'+rating+'", Description = "'+ Description+'", Fap = "'+Fap+'" WHERE Date = "'+currentDate+'";', (err, result) => {
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
});