// import { GetUsers } from './getUsers'
// import { CreateUser } from './createUser'

// const getUsers = new GetUsers()
// const createUser = new CreateUser()

// export const getUsersHandler = getUsers.handler
// export const createUserHandler = createUser.handler

import { handler as getUsersHandler } from './getUsers'
import { handler as createUserHandler } from './createUser'

export { getUsersHandler, createUserHandler }
