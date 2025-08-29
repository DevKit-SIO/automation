import axios, {type AxiosResponse} from "axios";
import type {ID, Response, ResponseCollection, Workflow} from "./_models.ts";

const HOST = process.env.N8N_HOST
const WORKFLOW_TEMPLATES = HOST + '/api/templates/search/'
const WORKFLOW = HOST + '/api/templates/workflows'

export const getTemplates = (query: string = ''): Promise<ResponseCollection<Workflow>> => {
    return axios.get(`${WORKFLOW_TEMPLATES}?${query}`)
        .then((response: AxiosResponse<ResponseCollection<Workflow>>) => response.data)
}

export const getWorkflow = (id: ID): Promise<Response<Workflow>> => {
    return axios.get(`${WORKFLOW}/${id}`)
        .then((response: AxiosResponse<Response<Workflow>>) => response.data)
}
