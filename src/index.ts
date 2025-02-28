import { GetUsers } from './getUsers'

const getUsers = new GetUsers()

export const getUsersHandler = getUsers.handler
