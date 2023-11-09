const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "todoApplication.db");
const app = express();

app.use(express.json());

let database = null;

const initiliazeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3008, () => {
      console.log("Server Running at http://localhost:3008/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initiliazeDbAndServer();

module.exports = app;

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM 
    todo
    WHERE 
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}'
    ;`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM 
    todo
    WHERE 
    todo LIKE '%${search_q}%'
     AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM 
    todo
    WHERE 
    todo LIKE '%${search_q}%'
     AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `SELECT * FROM 
    todo
    WHERE 
   todo LIKE '%${search_q}%';`;
  }
  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getAPI2 = `SELECT * FROM 
    todo
    WHERE
    id LIKE '${todoId}';`;
  const Query = await database.get(getAPI2);
  response.send(Query);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `INSERT INTO
    todo (id, todo, priority, status)
   VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT
   * 
   FROM 
   todo
WHERE 
    id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoColumn = `UPDATE todo 
  SET
  todo= '${todo}',
  priority= '${priority}',
  status = '${status}'
  WHERE 
  id = ${todoId};`;
  await database.run(updateTodoColumn);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo
    WHERE 
    id = ${todoId};`;
  await database.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
