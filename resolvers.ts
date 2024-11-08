import { type Collection, ObjectId } from 'mongodb'
import { UserModel, User, Amigos } from "./types.ts";

export const getAmigosFromUser = async (
    amigosUser: ObjectId[],
    usersCollection: Collection<UserModel>
): Promise<Amigos[]> => {
    const filteredDocs = await usersCollection.find({ _id: { $in: amigosUser } }).toArray();
    console.log(filteredDocs)
    const amigosDeUsuario: Amigos[] = [];

    if(filteredDocs && filteredDocs.length > 0)
    {
        await Promise.all(filteredDocs.map((elem: UserModel) => (
            amigosDeUsuario.push({
                id: elem._id.toString(),
                nombre: elem.nombre,
                correo: elem.correo,
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
                correo: elem.correo,
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
                correo: elem.correo,
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
    const filteredDocs = await usersCollection.find({ correo: email }).toArray();
    const usuariosEmail: User[] = [];

    if(filteredDocs && filteredDocs.length > 0)
    {
        await Promise.all(filteredDocs.map(async (elem: UserModel) => (
            usuariosEmail.push({
                id: elem._id.toString(),
                nombre: elem.nombre,
                correo: elem.correo,
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

    const { modifiedCount } = await usersCollection.updateOne({ correo: body.correo }, { $set: { ...userModificado } });

    if(modifiedCount === 0) return new Response("Usuario no encontrado.", { status: 404 });
    return new Response("OK", { status: 200 }); //MODIFICAR
};

export const borrarUser = async (
    correo: User,
    usersCollection: Collection<UserModel>
): Promise<Response> => {
    const { deletedCount } = await usersCollection.deleteOne({ correo: correo.correo });
    
    if(deletedCount)
    {
        const filteredDocs = await usersCollection.findOne({ correo: correo });
        if(filteredDocs)
            await usersCollection.updateMany({ _id: new ObjectId(filteredDocs._id) }, { $pull: { amigos: new ObjectId(filteredDocs._id) } }); 
        // NO HE SABIDO HACER ESTO Y NO FUNCIONA BIEN
        return new Response("Persona eliminada exitosamente.", { status: 200 });
    }
    return new Response("Usuario no encontrado.", { status: 404 });
};

/*export const añadirAmigo = async (
    correo: string,
    idAmigo: string[],
    usersCollection: Collection<UserModel>
): Promise<Response> => {
    const idsAmigos: ObjectId[] = Array(idAmigo.map(elem => new ObjectId(elem)));

    const filteredDocs = await usersCollection.findOne({ _id: { $in: idsAmigos } });
    const { modifiedCount } = await usersCollection.updateOne({ email: correo }, { $addToSet: { amigos: { $each: idsAmigos } } });

    if(!filteredDocs) return new Response("Amigo no encontrado.", { status: 404 });
    if(modifiedCount === 0) return new Response("Usuario no encontrado.", { status: 404 });
    return new Response("OK", { status: 200 }); //MODIFICAR
};*/

export const añadirAmigo = async (
    body: User,
    usersCollection: Collection<UserModel>
): Promise<Response> => {
    const idsAmigos: ObjectId[] = body.amigos.map(elem => new ObjectId(elem));
    const filteredDocs = await usersCollection.findOne({ _id: {$in: idsAmigos} });
    if(!filteredDocs) return new Response("Amigo no encontrado.", { status: 404 });
    
    const { modifiedCount } = await usersCollection.updateOne({ correo: body.correo }, { $addToSet: { amigos: { $each: idsAmigos } } });

    if(!modifiedCount) return new Response("Usuario no encontrado.", { status: 404 });
    return new Response("OK", { status: 200 }); //MODIFICAR
};

export const addUser = async (
    body: User,
    usersCollection: Collection<UserModel>
): Promise<Response> => {
    const filteredTlf = await usersCollection.findOne({ telefono: body.telefono });
    const filteredDocs = await usersCollection.findOne({ correo: body.correo });

    if(filteredDocs || filteredTlf) return new Response("El email o teléfono ya están registrados.", { status: 404 });

    const IDsAmigos:ObjectId[] = body.amigos.map(elem => new ObjectId(elem));

    const nuevoUser: UserModel = {
        _id: new ObjectId(),
        nombre: body.nombre,
        correo: body.correo,
        telefono: body.telefono,
        amigos: IDsAmigos
    }

    const { insertedId } = await usersCollection.insertOne(nuevoUser);

    if(insertedId)
    {
        return new Response(JSON.stringify({
            id: nuevoUser._id.toString(),
            nombre: nuevoUser.nombre,
            correo: nuevoUser.correo,
            telefono: nuevoUser.telefono,
            amigos: await getAmigosFromUser(nuevoUser.amigos, usersCollection)
        }), { status: 200 });
    }
    return new Response("No se ha podido añadir el usuario", { status: 404 });
};