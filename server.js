// index.js

const express = require('express');
const mariadb = require('mariadb');

const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Port sur lequel le serveur écoutera

// Configuration de body-parser pour lire les données JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = mariadb.createPool({
  host: '127.0.0.1',  // Remplacez par l'adresse de votre serveur MariaDB
  user: 'ymerejx',  // Remplacez par votre nom d'utilisateur
  password: '149999',  // Remplacez par votre mot de passe
  database: 'MyDaily',
  connectionLimit: 5
});

// Exemple de route pour récupérer des jours
app.get('/days', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT Sport.Id, 
        Day.Rating,
        Day.Piano, 
        Day.Skin, 
        Day.Sleep, 
        Day.Reading, 
        Day.Fap, 
        Sport.Activity, 
        Sport.Date FROM Day LEFT JOIN Sport ON Day.Date = Sport.Date ORDER BY Date ASC`); // Remplacez par votre requête SQL
    res.json(rows);
  } catch (err) {
    console.error("Erreur lors de la récupération des jours :", err);
    res.status(500).send(`Erreur lors de la récupération de la table DAY: ${err.message}`);
  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});




// Route pour ajouter un utilisateur
app.post('/addDay', async (req, res) => {
  const { rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate } = req.body;

  let conn;
  try {
    conn = await pool.getConnection(); // Obtenez une connexion du pool

    // Utilisez la méthode query pour insérer les données
    await conn.query('INSERT INTO Day (Rating, Reading, Piano, Skin, Sleep, Description, Fap, Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate]);

    res.status(200).send('Day ajouté avec succès');
    console.log("Succès : addDay");

  } catch (err) {
    console.log(err);
    res.status(500).send('Erreur lors de l\'ajout d\'un day');
  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});


// Route pour ajouter un sport
app.post('/addSport', async (req, res) => {
  const { currentSportSelection, currentDate } = req.body;

  let conn;
  try {
    conn = await pool.getConnection(); // Obtenez une connexion du pool

    // Utilisez la méthode query pour insérer les données
    await conn.query('INSERT INTO Sport (Activity, Date) VALUES (?, ?)', 
      [currentSportSelection, currentDate]);

    res.status(200).send('Sport ajouté avec succès');
    console.log("Succès : addSport");

  } catch (err) {
    console.log(err);
    res.status(500).send('Erreur lors de l\'ajout d\'un sport');
  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});


// Route pour récupérer les sports par date
app.post('/getSport', async (req, res) => {
  const { currentDate } = req.body;

  let conn;
  try {
    conn = await pool.getConnection(); // Obtenez une connexion du pool

    // Utilisez une requête paramétrée pour éviter les injections SQL
    const result = await conn.query('SELECT * FROM Sport WHERE Date = ?', [currentDate]);

    res.status(200).json(result);
    console.log("Succès : getSport");

  } catch (err) {
    console.log(err);
    res.status(500).send('Erreur lors de la récupération des sports du jour');
  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});


// Route pour supprimer un sport par son ID
app.post('/removeSport', async (req, res) => {
  const { sportId } = req.body;

  let conn;
  try {
    conn = await pool.getConnection(); // Obtenez une connexion du pool

    // Utilisez une requête paramétrée pour éviter les injections SQL
    await conn.query('DELETE FROM Sport WHERE Id = ?', [sportId]);


    res.status(200).send("remove sport success");
    console.log("Succès : removeSport");

  } catch (err) {
    console.log(err);
    res.status(500).send('Erreur lors de la suppression d\'un sport du jour');
  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});


// Route pour obtenir les données du jour
app.post('/getToday', async (req, res) => {
  const { currentDate } = req.body;

  let conn;
  try {
    conn = await pool.getConnection(); // Obtenez une connexion du pool

    // Utilisez une requête paramétrée pour éviter les injections SQL
    const result = await conn.query(`
      SELECT 
        Sport.Id, 
        Day.Rating, 
        Day.Piano, 
        Day.Skin, 
        Day.Sleep, 
        Day.Reading, 
        Day.Description, 
        Day.Fap, 
        Sport.Activity, 
        Day.Date 
      FROM Day 
      LEFT JOIN Sport 
      ON Day.Date = Sport.Date 
      WHERE Day.Date = ?`, 
      [currentDate]
    );

    res.status(200).json(result);
    console.log("Succès : getToday");

  } catch (err) {
    console.log(err);
    res.status(500).send('Erreur lors de la récupération du jour ' + currentDate);

  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});


// Exemple de route pour obtenir les alertes
app.post('/getAlert', async (req, res) => {
  const { currentDate } = req.body;

  // Variables d'alerte
  let dayWithoutSport = -1;
  let needSportCount = true;

  let dayWithoutPiano = -1;
  let needPianoCount = true;

  let dayWithoutSkin = -1;
  let needSkinCount = true;

  let dayWithoutReading = -1;
  let needReadingCount = true;

  let dayWithoutFap = -1;
  let lastFap = "";
  let needFapCount = true;

  let conn;
  try {
    conn = await pool.getConnection(); // Obtenez une connexion du pool

    // Récupération des données de la table Day
    const daysResult = await conn.query('SELECT * FROM Day ORDER BY Date DESC;');

    daysResult.forEach(element => {
      // Piano
      if (needPianoCount) {
        dayWithoutPiano++;
      }
      if (element.Piano && needPianoCount) {
        needPianoCount = false;
      }

      // Skin
      if (needSkinCount) {
        dayWithoutSkin++;
      }
      if (element.Skin && needSkinCount) {
        needSkinCount = false;
      }

      // Reading
      if (needReadingCount) {
        dayWithoutReading++;
      }
      if (element.Reading && needReadingCount) {
        needReadingCount = false;
      }

      // Fap
      if (needFapCount) {
        dayWithoutFap++;
      }
      if (element.Fap !== "Pure" && needFapCount) {
        lastFap = element.Fap;
        needFapCount = false;
      }
    });

    // Récupération des données de la table Sport
    const sportsResult = await conn.query('SELECT Sport.Activity, Day.Date FROM Day LEFT JOIN Sport ON Day.Date = Sport.Date ORDER BY Day.Date DESC;');

    let date = "";
    let dateOk = false;
    sportsResult.forEach(element => {
      if (date !== element.Date) {
        date = element.Date;
        dateOk = false;
      }

      // Sport
      if (needSportCount && !dateOk) {
        dayWithoutSport++;
      }
      if (element.Activity && needSportCount) {
        needSportCount = false;
      }
    });

    const resultsAlert = [{ dayWithoutSport, dayWithoutPiano, dayWithoutSkin, dayWithoutReading, dayWithoutFap, lastFap }];
    res.status(200).json(resultsAlert);
    console.log("Succès : getAlert");

  } catch (err) {
    console.log(err);
    res.status(500).send('Erreur lors de la récupération des alertes');

  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});


app.post('/updateToday', async (req, res) => {
  const { rating, readingChecked, pianoChecked, skinChecked, sleepValue, Description, Fap, currentDate } = req.body;

  let conn;
  try {
    conn = await pool.getConnection(); // Obtenez une connexion du pool

    // Utilisation des requêtes paramétrées pour éviter les injections SQL
    const query = `
      UPDATE Day
      SET
        Skin = ?,
        Piano = ?,
        Sleep = ?,
        Reading = ?,
        Rating = ?,
        Description = ?,
        Fap = ?
      WHERE Date = ?
    `;
    const values = [skinChecked, pianoChecked, sleepValue, readingChecked, rating, Description, Fap, currentDate];
    
    await conn.query(query, values);


    res.status(200).json('Update success');
    console.log("Succès : updateToday");

  } catch (err) {
    console.log(err);
    res.status(500).send('Erreur lors de l\'update Today');

  } finally {
    if (conn) conn.release(); // Toujours libérer la connexion après usage
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});