import { GetCategories } from './getCategories'
import { GetExamQuestions } from './getExamQuestions'

const getCategories = new GetCategories()
const getExamQuestions = new GetExamQuestions()

export const getCategoriesHandler = getCategories.handler
export const getExamQuestionsHandler = getExamQuestions.handler
