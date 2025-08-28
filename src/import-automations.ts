import {getTemplates, getWorkflow} from "./_requests.ts";
import type {Category, ResponseCollection, Workflow} from "./_models.ts";

class ImportAutomations {


    getCategories(workflow: Workflow): Array<Category> {


        return []
    }

    async getAutomations() {
        const data: ResponseCollection<Workflow> = await getTemplates('')

        const categories: Array<Category> = []

        for (const w of data.workflows) {
            const wf = await getWorkflow(w?.id)
            const workflow: Workflow = {...w, ...wf.workflow}

            categories.concat(workflow.categories)
        }

        console.log(categories)
    }

    translate() {

    }

    save() {

    }

    run() {
        this.getAutomations()
    }
}

(new ImportAutomations()).run()
