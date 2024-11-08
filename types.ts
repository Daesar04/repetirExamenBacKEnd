import { ObjectId } from 'mongodb'

export type UserModel = {
    _id: ObjectId,
    nombre: string,
    correo: string,
    telefono: string,
    amigos: ObjectId[]
};

export type User = {
    id: string,
    nombre: string,
    correo: string,
    telefono: string,
    amigos: Amigos[]
};

export type Amigos = {
    id: string,
    nombre: string,
    correo: string,
    telefono: string
};