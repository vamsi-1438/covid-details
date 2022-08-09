const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

const database = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const covertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.district_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT * FROM State`;
  const statesArray = await database.all(getStateQuery);
  response.send(
    statesArray.map((each) => covertStateDbObjectToResponseObject(statesArray))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSqlQuery = `SELECT * FROM state WHERE state_id=${stateId}`;
  const state = await database.get(getSqlQuery);
  response.send(covertStateDbObjectToResponseObject(state));
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId}`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictDbObject(district));
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postQuery = `INSERT INTO district(state_id,district_name,cases,cured,active,deaths)
    VALUES('${stateId}','${districtName}',${cases},${cures},${active},${deaths})`;
  await database.run(postQuery);
  response.send("District Successfully Added");
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district WHERE district_id=${districtId} `;
  await database.run(deleteQuery);
  response.run("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updatedDistrictQuery = `UPDATE district 
    SET district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    deaths=${deaths} WHERE district_id=${districtId}`;
  await database.run(updatedDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT SUM(cases),
   SUM(cured),SUM(deaths),SUM(active) FROM district WHERE state_id=${stateId}`;
  const stats = await database.run(getStateQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT state_name FROM district NATURAL_JOIN state WHERE district_id=${districtId}`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});
module.exports = app;
