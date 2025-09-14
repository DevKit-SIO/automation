import figlet from "figlet";
import {parseArgs} from "util";
import {access, mkdir, writeFile} from "node:fs/promises";
import {dirname, join, resolve} from "node:path";
import {existsSync} from 'node:fs';
import {readJSONSync} from 'fs-extra';
import qs from "qs";
import {getTemplates, getWorkflow} from "./_requests.ts";
import {translateJSON} from "./i18n";
import type {Category, CommandOptions, ResponseCollection, Workflow} from "./_models.ts";

class ImportAutomations {
    // locals = ["en-US", "fr-FR", "es-ES", "pt-PT", "de-DE", "it-IT", "ar-MA"];

    options: CommandOptions
    locals = ["fr-FR"];
    workflowsDir = "automation";
    localDir = join(this.workflowsDir, 'i18n');

    constructor(options: CommandOptions) {
        this.options = options
    }

    private async _ensure(directoryPath: string): Promise<void> {
        try {
            await access(directoryPath);
        } catch {
            let dir = directoryPath;
            if (dir?.endsWith('.json'))
                dir = dirname(directoryPath)
            await mkdir(dir, {recursive: true});
        }
    }

    private _sanitizeFileName(name: string): string {
        const replaced = name
            .replace(/[\\\/:*?"<>#|]/g, "-")
            .replace(/\s+/g, " ")
            .trim();
        const withoutTrailing = replaced.replace(/[ .]+$/, "");
        const maxLength = 200;
        return withoutTrailing.length > maxLength
            ? withoutTrailing.slice(0, maxLength)
            : withoutTrailing;
    }

    _getCategories(workflow: Workflow): Array<Category> {
        const categoryMap = new Map<number, Category>();

        for (const c of workflow.categories || []) {
            if (!categoryMap.has(c.id)) {
                categoryMap.set(c.id, c);
            }
        }

        return Array.from(categoryMap.values());
    }

    async _translate(
        workflow: Workflow,
        locale: string
    ): Promise<Workflow> {
        const payload = workflow as any;
        return (await translateJSON(payload, locale)) as Workflow;
    }

    async _saveCategories(
        categories: Array<Category>,
        path: string = "automation"
    ) {
        try {
            const baseDir = path;
            await this._ensure(baseDir);
            const sorted = [...(categories || [])].sort((a, b) => a.id - b.id);
            const filePath = join(baseDir, "categories.json");
            await writeFile(filePath, JSON.stringify(sorted, null, 2), "utf8");
            console.info(`Saved ${sorted.length} categories to ${filePath}`);
        } catch (error) {
            console.error("Failed to save categories:", {
                error,
                targetPath: path,
            });
        }
    }

    async _save(
        workflow: Workflow,
        path: string
    ) {
        try {
            await this._ensure(path);
            // const originalName =
            //     originalNames?.[index] ?? workflow.__originalName ?? workflow.name;
            // delete workflow.__originalName;
            // const fileName = `${this.sanitizeFileName(originalName)}.json`;
            await writeFile(path, JSON.stringify(workflow, null, 2), "utf8");
        } catch (e) {
        }
    }

    async _getAutomations(rows: number = 100): Promise<void> {
        const {refresh, translate} = this.options
        let categories: Array<Category> = []
        let foundWorkflows: number = 0;
        let hasMorePages = true;
        const pagination = {page: 1, rows};

        try {
            const categoriesPath = resolve(this.workflowsDir, 'categories.json');
            categories = readJSONSync(categoriesPath) as Array<Category>
        } catch (e) {
        }

        // Calculate the cutoff date (18 months ago)
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 18);

        do {
            try {
                console.info(`Fetching page ${pagination?.page}...`);
                const data: ResponseCollection<Workflow> = await getTemplates(
                    `${qs.stringify(pagination, {encode: false})}`
                );
                console.info(
                    `${foundWorkflows + data.workflows?.length} workflow found.`
                );

                console.info(`Importing ${data.workflows?.length} workflows...`);

                // Filter workflows by creation date before processing
                const recentWorkflows =
                    data.workflows?.filter((workflow) => {
                        if (!workflow.createdAt) return false;
                        const createdDate = new Date(workflow.createdAt);

                        // Check if workflow was created in the last 18 months
                        if (createdDate < cutoffDate) return false;

                        // Check if workflow name or description contains "MCP" (case-insensitive)
                        const name = workflow.name?.toLowerCase() || "";
                        const description = workflow.description?.toLowerCase() || "";
                        if (name.includes("mcp") || description.includes("mcp")) {
                            console.info(`Filtering out MCP workflow: ${workflow.name}`);
                            return false;
                        }

                        return true;
                    }) || [];

                console.info(
                    `${recentWorkflows.length} workflows created in the last 18 months.`
                );

                for (const w of recentWorkflows) {
                    try {
                        const {workflow} = await getWorkflow(w?.id);

                        categories = [...new Set([...categories, ...this._getCategories(workflow)])];

                        const workflowFile: string = join(this.workflowsDir, `${this._sanitizeFileName(workflow.name)}.json`);
                        if (!existsSync(workflowFile) || refresh) {
                            await this._save(workflow, workflowFile)
                        }

                        if (translate) {
                            for (const local of this.locals) {
                                try {
                                    const localeDir = join(this.localDir, local);
                                    await this._ensure(localeDir);

                                    const translationFile: string = join(localeDir, `${this._sanitizeFileName(workflow.name)}.json`);
                                    if (!existsSync(translationFile) || refresh) {
                                        const translated = await this._translate(workflow, local);
                                        await this._save(translated, translationFile);
                                    }
                                } catch (e: any) {
                                    console.error(`Error translating workflow: "${workflow.name}"(${workflow.id}). (${e.message})`);
                                }
                            }
                        }

                        console.log(`Workflow "${workflow.name}"(${workflow.id}) imported successfully`)
                    } catch (e) {

                    }

                    foundWorkflows++;
                }
                console.info(`${foundWorkflows} workflows imported.`);

                pagination.page++;

                if (data?.totalWorkflows < pagination.page * pagination.rows)
                    hasMorePages = false;

                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (e) {
                console.warn(
                    `Error fetching page ${pagination?.page}. Skipping to next page...`,
                    e
                );
                pagination.page++;
            }
        } while (hasMorePages);

        console.info(`Total workflows fetched: ${foundWorkflows}`);

        await this._saveCategories(categories)

        for (const local of this.locals) {
            const translatedCategories = (await translateJSON(
                categories,
                local
            )) as Array<Category>;

            await this._saveCategories(translatedCategories, join(this.localDir, local));
        }
    }

    _help() {
        console.info('Unitalk AI Automation script\n')
        console.info('This script scrap the automation workflow examples from N8N Api.')
        console.info('usage: bun run rsync [options]')
        console.info('\toptions:')
        console.info('\t\t-h, --help:       Show the help message.')
        console.info('\t\t-r, --refresh:    Re-import all the automation workflow examples.')
        console.info('\t\t-t, --translate:  Translate the automation workflow examples using "gpt-4o-mini" model by default.')
        console.info('\t\t-m, --madel:      OpenAI model to use for translation (coming soon).')
    }

    async run() {
        const {help} = this.options

        const unitalk = figlet.textSync("Unitalk AI");
        console.log(unitalk)

        if (!help) {
            await this._getAutomations();
        } else {
            this._help()
        }
    }
}

const {values} = parseArgs({
    args: Bun.argv,
    options: {
        help: {
            type: 'boolean',
            default: false,
            short: 'h',
        },
        refresh: {
            type: 'boolean',
            default: false,
            short: 'r',
        },
        translate: {
            type: 'boolean',
            default: false,
            short: 't',
        },
        madel: {
            type: 'string',
            default: 'gpt-4o-mini',
            short: 'm',
        },
    },
    strict: true,
    allowPositionals: true,
});

new ImportAutomations(values).run();
