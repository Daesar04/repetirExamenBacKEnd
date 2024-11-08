import { MongoClient } from 'mongodb'

// Connection URL
const url = Deno.env.get("MONGO_URL");

if(!url)
{
  console.log("no se ha podido conectar a la url");
  Deno.exit(1);
}

const client = new MongoClient(url);

// Database Name
const dbName = 'examenBackEnd';

// Use connect method to connect to the server
await client.connect();
console.log('Connected successfully to server');
const db = client.db(dbName);
const userCollection = db.collection<UserModel>('users');