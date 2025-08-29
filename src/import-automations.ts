import {getTemplates, getWorkflow} from "./_requests.ts";
import type {Category, ResponseCollection, Workflow} from "./_models.ts";
import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {translateJSON} from "../scripts/i18n.ts";
import qs from 'qs'

class ImportAutomations {
    locals = ["en-US", "fr-FR", "es-ES", "pt-PT", "de-DE", "it-IT", "ar-MA"];

    getCategories(workflows: Array<Workflow>): Array<Category> {
        const categoryMap = new Map<number, Category>();

        for (const wf of workflows) {
            for (const c of wf.categories || []) {
                if (!categoryMap.has(c.id)) {
                    categoryMap.set(c.id, c);
                }
            }
        }

        return Array.from(categoryMap.values());
    }

    async getAutomations() {
        const workflows: Array<Workflow> = [];
        const pagination = {
            page: 1,
            rows: 20,
        }
        let hasMorePages = true;

        do {
            try {
                console.info(`Fetching page ${pagination?.page}...`);
                const data: ResponseCollection<Workflow> = await getTemplates(
                    `${qs.stringify(pagination, {encode: false})}`
                );
                console.info(`${workflows.length + data.workflows?.length} workflow found.`);


                console.info(`Importing ${workflows.length + data.workflows?.length} workflows...`);
                for (const w of data.workflows) {
                    const wf = await getWorkflow(w?.id);
                    workflows.push({...w, ...wf.workflow});
                }
                console.info(`${workflows.length + data.workflows?.length} workflow imported.`);

                pagination.page++;

                if (data?.totalWorkflows < pagination.page * pagination.rows)
                    hasMorePages = false
            } catch (e) {
            }
        } while (hasMorePages)

        console.info(`Total workflows fetched: ${workflows.length}`);
        return workflows;
    }

    async translate(
        workflows: Array<Workflow>,
        locale: string
    ): Promise<Array<Workflow>> {
        const translated: Array<Workflow> = [];
        for (const wf of workflows) {
            const payload = {...wf} as any;
            (payload as any).__originalName = wf.name;
            const t = (await translateJSON(payload, locale)) as Workflow;
            if (!t.__originalName) {
                t.__originalName = wf.name;
            }
            translated.push(t);
        }
        return translated;
    }

    async saveCategories(
        categories: Array<Category>,
        path: string = "automation"
    ) {
        const baseDir = path;
        const sorted = [...categories].sort((a, b) => a.id - b.id);
        const filePath = join(baseDir, "Categories.json");
        await writeFile(filePath, JSON.stringify(sorted, null, 2), "utf8");
    }

    async save(workflows: Array<Workflow>, path: string = "automation") {
        const baseDir = path;

        const tasks = workflows.map(async (workflow) => {
            const originalName = workflow.__originalName ?? workflow.name;
            delete workflow.__originalName;
            const fileName = `${originalName}.json`;
            const filePath = join(baseDir, fileName);
            await writeFile(filePath, JSON.stringify(workflow, null, 2), "utf8");
        });

        await Promise.all(tasks);
    }

    async run() {
        const workflows: Array<Workflow> = await this.getAutomations();

        const categoryMap = new Map<number, Category>();
        for (const wf of workflows) {
            for (const c of wf.categories || []) {
                if (!categoryMap.has(c.id)) {
                    categoryMap.set(c.id, c);
                }
            }
        }
        const categories = this.getCategories(workflows);

        await this.save(workflows);
        await this.saveCategories(categories);

        for (const locale of this.locals) {
            const localeDir = join("automation", "i18n", locale);
            await mkdir(localeDir, {recursive: true});

            const translatedWorkflows = await this.translate(workflows, locale);
            await this.save(translatedWorkflows, localeDir);

            const translatedCategories = (await translateJSON(
                categories,
                locale
            )) as Array<Category>;
            await this.saveCategories(translatedCategories, localeDir);
        }
    }
}

new ImportAutomations().run();
