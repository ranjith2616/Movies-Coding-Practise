const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializationServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Running Server at http:localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
  }
};

initializationServerAndDB();

const convertDBObjIntoResponseObj = (dbObj) => {
  return {
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    movieName: dbObj.movie_name,
    leadActor: dbObj.lead_actor,
  };
};

const convertDirectorNames = (dirObj) => {
  return {
    directorId: dirObj.director_id,
    directorName: dirObj.director_name,
  };
};

// API 1 GET Method
app.get("/movies/", async (request, response) => {
  const getMovieNames = `
  SELECT movie_name FROM movie;
  `;
  let movieNamesList = await db.all(getMovieNames);

  response.send(
    movieNamesList.map((eachPlayer) => convertDBObjIntoResponseObj(eachPlayer))
  );
});

//API 2 POST Method
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const addPlayerDetails = `
  INSERT INTO
  movie (director_id, movie_name, lead_actor)
  VALUES (
      '${directorId}',
      '${movieName}',
      '${leadActor}'
  );`;
  let dbResponse = await db.run(addPlayerDetails);
  let lastIDOfPostedMovies = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

// API 3 GET Method returns movie name based movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetails = `
    SELECT * FROM movie
    WHERE movie_id = '${movieId}';
    `;
  const movieDetail = await db.get(getMovieDetails);
  response.send(convertDBObjIntoResponseObj(movieDetail));
});

// API 4 Update the details of movie details based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const updatePlayerDet = `
    UPDATE 
    movie
    SET 
    director_id = '${directorId}',
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id = '${movieId}';
    `;
  await db.run(updatePlayerDet);
  response.send("Movie Details Updated");
});

// API 5 Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const deleteMovieDet = `
    DELETE FROM movie WHERE movie_id = '${movieId}';
    `;
  await db.run(deleteMovieDet);
  response.send("Movie Removed");
});

// API 6 GET Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getDirectorList = `
    SELECT * FROM director;
    `;
  const directorList = await db.all(getDirectorList);
  response.send(directorList.map((each) => convertDirectorNames(each)));
});

// API 7 GET Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const getMovieNamesBasedOnDirector = `
    SELECT movie_name FROM movie WHERE director_id = '${directorId}';
    
    `;
  const moviesList = await db.all(getMovieNamesBasedOnDirector);
  response.send(moviesList.map((each) => convertDBObjIntoResponseObj(each)));
});

module.exports = app;
