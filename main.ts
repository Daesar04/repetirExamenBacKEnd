import { MongoClient } from 'mongodb'
import { UserModel } from "./types.ts";
import { getUsersByName, getAllUsers,getUsersByEmail, modificarUser, borrarUser } from "./resolvers.ts";

// Connection URL
const url = Deno.env.get("MONGO_URL");

if(!url)
{
  console.log("no se ha podido conectar a la url");
  Deno.exit(1);
}

const client = new MongoClient(url);

// Database Name
const dbName = 'repetirExamenBackEnd';

// Use connect method to connect to the server
await client.connect();
console.log('Connected successfully to server');
const db = client.db(dbName);
const userCollection = db.collection<UserModel>('users');

const handler = async (
  req: Request
): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if(method === "GET")
  {
    if(path === "/personas")
    {
      const nombre = url.searchParams.get("nombre");

      if(nombre) return await getUsersByName(nombre, userCollection);
      return await getAllUsers(userCollection);
    }
    else if(path === "/persona")
    {
      const email = url.searchParams.get("email");

      if(email) return await getUsersByEmail(email, userCollection);
    }
  }
  else if(method === "POST")
  {
    if(path === "/personas")
    {
      
    }
  }
  else if(method === "PUT")
  {
    if(path === "/personas")
    {
      const body = await req.json();

      if(!body.email || !(body.nombre || body.telefono || body.amigos)) return new Response("Faltan datos.", { status: 400 });
      return await modificarUser(body, userCollection);
    }
  }
  else if(method === "DELETE")
  {
    if(path === "/personas")
    {
      const body = await req.json();

      if(!body.email) return new Response("Falta email.", { status: 400 });
      return await borrarUser(body, userCollection);
    }
  }
  return new Response("endpoint not found", { status: 400 });
};

Deno.serve({ port: 3000 }, handler);