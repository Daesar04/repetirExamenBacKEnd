import { type Collection, ObjectId } from 'mongodb'
import { UserModel, User, Amigos } from "./types.ts";

export const getAmigosFromUser = async (
    amigosUser: ObjectId[],
    usersCollection: Collection<UserModel>
): Promise<Amigos[]> => {
    const filteredDocs = await usersCollection.find({ _id: { $in: amigosUser } }).toArray();

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
    const filteredDocs = await usersCollection.find({ nombre: name }).toArray();
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

export const getAllUsers = async(
    usersCollection: Collection<UserModel>
): Promise<Response> => {
    const findResult = await usersCollection.find({}).toArray();

    const usuarios: User[] = [];

    if(findResult && findResult.length > 0)
    {
        await Promise.all(findResult.map(async (elem: UserModel) => (
            usuarios.push({
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
        return new Response("No hay usuarios", { status: 404 });
    }
    return new Response(JSON.stringify(usuarios), { status: 200 });
};

export const getUsersByEmail = async (
    email: string,
    usersCollection: Collection<UserModel>
): Promise<Response>  => {
    const filteredDocs = await usersCollection.find({ email: email }).toArray();
    const usuariosEmail: User[] = [];

    if(filteredDocs && filteredDocs.length > 0)
    {
        await Promise.all(filteredDocs.map(async (elem: UserModel) => (
            usuariosEmail.push({
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
        return new Response("Persona no encontrada.", { status: 404 });
    }

    return new Response(JSON.stringify(usuariosEmail), { status: 200 });
};

export const modificarUser = async (
    body: Partial<User>,
    usersCollection: Collection<UserModel>
): Promise<Response> => {
    const userModificado: Partial<UserModel> = {};

    const filteredDocs = await usersCollection.findOne({ telefono: body.telefono });
    if(filteredDocs) return new Response("No puede usar ese telefono ya pertenece a otro user", { status: 404 });

    if(body.nombre) userModificado.nombre = body.nombre;
    if(body.telefono) userModificado.telefono = body.telefono;
    if(body.amigos) userModificado.amigos = body.amigos;

    const { modifiedCount } = await usersCollection.updateOne({ email: body.email }, { $set: { ...userModificado } });

    if(modifiedCount === 0) return new Response("Usuario no encontrado.", { status: 404 });
    return new Response("OK", { status: 200 }); //MODIFICAR
};

export const borrarUser = async (
    correo: string,
    usersCollection: Collection<UserModel>
): Promise<Response> => {

    const { deletedCount } = await usersCollection.deleteOne({ email: correo });
    
    if(deletedCount)
    {
        const filteredDocs = await usersCollection.findOne({ email: correo });
        if(filteredDocs)
            await usersCollection.updateMany({ email: correo }, { $pull: { amigos: new ObjectId(filteredDocs._id) } }); // NO HE SABIDO HACER ESTO
        return new Response("Persona eliminada exitosamente.", { status: 200 });
    }
    return new Response("Usuario no encontrado.", { status: 404 });
};