import { type Collection, ObjectId } from 'mongodb'
import { UserModel, User, Amigos } from "./types.ts";

export const getAmigosFromUser = async (
    amigosUser: ObjectId[],
    usersCollection: Collection<UserModel>
): Promise<Amigos[]> => {
    const filteredDocs = await usersCollection.find({ _id: {$in: amigosUser } }).toArray();

    const amigosDeUsuario: Amigos[] = [];

    if(filteredDocs && filteredDocs.length > 0)
    {
        await Promise.all(filteredDocs.map((elem: UserModel) => (
            amigosDeUsuario.push({
                id: elem._id.toString(),
                nombre: elem.nombre,
                email: elem.email,
                telefono: elem.telefono
            })
        )));
    }
    return amigosDeUsuario;
};

export const getUsersByName = async(
    name: string,
    usersCollection: Collection<UserModel>
): Promise<Response>  => {
    const filteredDocs = await usersCollection.find({ nombre: {$in: name } }).toArray();
    
    const usuariosNombre: User[] = [];

    if(filteredDocs && filteredDocs.length > 0)
    {
        await Promise.all(filteredDocs.map(async (elem: UserModel) => (
            usuariosNombre.push({
                id: elem._id.toString(),
                nombre: elem.nombre,
                email: elem.email,
                telefono: elem.telefono,
                amigos: await getAmigosFromUser(elem.amigos, usersCollection)
            })
        )));
    }
    else
    {
        return new Response("No existe una persona con ese nombre", { status: 404 });
    }

    return new Response(JSON.stringify(usuariosNombre), { status: 200 });


};