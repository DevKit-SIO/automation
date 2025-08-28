import {getTemplates, getWorkflow} from "./_requests.ts";
import type {Category, ResponseCollection, Workflow} from "./_models.ts";

class ImportAutomations {

    locals = [
        'fr-FR',
        'fr-CA',
        'zh-CN',
    ]

    getCategories(workflow: Workflow): Array<Category> {


        return []
    }

    async getAutomations() {
        const workflows: Array<Workflow> = []

        const data: ResponseCollection<Workflow> = await getTemplates('')
        for (const w of data.workflows) {
            const wf = await getWorkflow(w?.id)
            workflows.push({...w, ...wf.workflow})
        }

        return workflows
    }

    translate(workflows: Array<Workflow>, local: string): Array<Workflow> {

        return []
    }

    saveCategories(categories: Array<Category>, path: string = 'automation') {

    }

    save(workflows: Array<Workflow>, path: string = 'automation') {

    }

    async run() {
        let categories: Array<Category> = []
        const workflows: Array<Workflow> = await this.getAutomations()

        // categories = categories.concat(workflow.categories)

        await this.save(workflows)
        await this.saveCategories(categories)


    }
}

(new ImportAutomations()).run()
