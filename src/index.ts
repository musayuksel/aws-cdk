import { GetCategories } from './getCategories'
import { GetExamQuestions } from './getExamQuestions'
import { CreateCategory } from './postCategory'

const getCategories = new GetCategories()
const getExamQuestions = new GetExamQuestions()
const postCategory = new CreateCategory()

export const getCategoriesHandler = getCategories.handler
export const getExamQuestionsHandler = getExamQuestions.handler
export const postCategoryHandler = postCategory.handler
