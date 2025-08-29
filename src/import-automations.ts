import { getTemplates, getWorkflow } from "./_requests.ts";
import type { Category, ResponseCollection, Workflow } from "./_models.ts";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { translateJSON } from "./i18n";
import qs from "qs";

class ImportAutomations {
  // locals = ["en-US", "fr-FR", "es-ES", "pt-PT", "de-DE", "it-IT", "ar-MA"];
  locals = ["fr-FR"];

  private async ensureDirectory(directoryPath: string): Promise<void> {
    try {
      await access(directoryPath);
    } catch {
      await mkdir(directoryPath, { recursive: true });
    }
  }

  private sanitizeFileName(name: string): string {
    const replaced = name
      .replace(/[\\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
    const withoutTrailing = replaced.replace(/[ .]+$/, "");
    const maxLength = 200;
    return withoutTrailing.length > maxLength
      ? withoutTrailing.slice(0, maxLength)
      : withoutTrailing;
  }

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
    };
    let hasMorePages = true;

    // Calculate the cutoff date (18 months ago)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 18);

    do {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.info(`Fetching page ${pagination?.page}...`);
        const data: ResponseCollection<Workflow> = await getTemplates(
          `${qs.stringify(pagination, { encode: false })}`
        );
        console.info(
          `${workflows.length + data.workflows?.length} workflow found.`
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
          const wf = await getWorkflow(w?.id);
          workflows.push({ ...w, ...wf.workflow });
        }
        console.info(`${workflows.length} workflows imported.`);

        pagination.page++;

        if (data?.totalWorkflows < pagination.page * pagination.rows)
          hasMorePages = false;
      } catch (e) {
        console.warn(
          `Error fetching page ${pagination?.page}. Skipping to next page...`,
          e
        );
        pagination.page++;
        continue;
      }
    } while (hasMorePages);

    console.info(`Total workflows fetched: ${workflows.length}`);
    return workflows;
  }

  async translate(
    workflows: Array<Workflow>,
    locale: string
  ): Promise<Array<Workflow>> {
    const translated: Array<Workflow> = [];
    for (const wf of workflows) {
      const payload = { ...wf } as any;
      const t = (await translateJSON(payload, locale)) as Workflow;
      translated.push(t);
    }
    return translated;
  }

  async saveCategories(
    categories: Array<Category>,
    path: string = "automation"
  ) {
    try {
      const baseDir = path;
      await this.ensureDirectory(baseDir);
      const sorted = [...(categories || [])].sort((a, b) => a.id - b.id);
      const filePath = join(baseDir, "Categories.json");
      await writeFile(filePath, JSON.stringify(sorted, null, 2), "utf8");
      console.info(`Saved ${sorted.length} categories to ${filePath}`);
    } catch (error) {
      console.error("Failed to save categories:", {
        error,
        targetPath: path,
      });
    }
  }

  async save(
    workflows: Array<Workflow>,
    path: string = "automation",
    originalNames?: Array<string>
  ) {
    const baseDir = path;
    await this.ensureDirectory(baseDir);

    const tasks = workflows.map(async (workflow, index) => {
      const originalName =
        originalNames?.[index] ?? workflow.__originalName ?? workflow.name;
      delete workflow.__originalName;
      const fileName = `${this.sanitizeFileName(originalName)}.json`;
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
      await this.ensureDirectory(localeDir);

      const translatedWorkflows = await this.translate(workflows, locale);
      const originalNames = workflows.map((wf) => wf.name);
      await this.save(translatedWorkflows, localeDir, originalNames);

      const translatedCategories = (await translateJSON(
        categories,
        locale
      )) as Array<Category>;
      await this.saveCategories(translatedCategories, localeDir);
    }
  }
}

new ImportAutomations().run();
