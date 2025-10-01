import url from "url";
import qs from "qs";
import type {ApiWorkflowsParams, Category, Workflow} from "./src/_models";
import figlet from "figlet";
import {readdirSync, readFileSync, readJSONSync} from "fs-extra";
import {join, resolve} from "node:path";
import {openapiSpec} from "./src/openapi";
import swaggerDist from "swagger-ui-dist";

let cli_params = {
    dev: false,
    host: 'localhost',
    port: 3000,
}

if (!process.browser) {
    const {parseArgs} = require('util')
    const {values} = parseArgs({
        args: Bun.argv,
        options: {
            dev: {
                type: 'boolean',
                default: false,
            },
            port: {
                type: 'string',
                default: '3000',
                short: 'p'
            },
            host: {
                type: 'string',
                default: '127.0.0.1',
                short: 'h'
            },
        },
        strict: true,
        allowPositionals: true,
    });
    cli_params = values
}
const locals = ["en-US", "fr-FR"]; // "es-ES", "pt-PT", "de-DE", "it-IT", "ar-MA"
const workflowsDir = "automation";
const localDir = join(workflowsDir, 'i18n');
const defaultPagination = {
    page: 1,
    items: 25,
}


const server = Bun.serve({
    routes: {
        "/api/workflows/": {
            GET: async (req: any) => {
                let params: ApiWorkflowsParams = {
                    lang: 'en-US',
                    ...defaultPagination,
                    ...qs.parse(url.parse(req.url, true).search?.substr(1) as string, {})
                } as ApiWorkflowsParams

                if (params?.lang && locals.includes(params?.lang)) {
                    try {
                        const dir = `${params?.lang === 'en-US' ? workflowsDir : join(localDir, params?.lang)}`;
                        const workflows: Array<Workflow> = [];
                        const workflowsFiles = readdirSync(dir, {
                            withFileTypes: true,
                            recursive: false,
                        }).slice((params.page - 1) * params?.items, params.page * params?.items);

                        for (const workflowsFile of workflowsFiles) {
                            if (workflowsFile.name.includes('categories')) continue;
                            if (!workflowsFile.isFile()) continue;
                            if (!workflowsFile.name.endsWith('.json')) continue;

                            const wf: Workflow = readJSONSync(join(dir, workflowsFile?.name))

                            if (!params?.categories || params?.categories?.length === 0) {
                                workflows.push(wf)
                                continue;
                            }

                            if (wf?.categories?.filter((c) => params?.categories?.includes(`${c.id}`))?.length > 0) {
                                workflows.push(wf)
                            }
                        }

                        return Response.json(workflows, {status: 200});
                    } catch (e: any) {
                        return Response.json({message: e.message,}, {status: 500});
                    }
                }

                return new Response("Not Found", {status: 404});
            }
        },
        "/api/workflows/:id/": {
            GET: async (req: any) => {
                const {id} = req.params;
                const params: { lang: string } = {
                    lang: 'en-US',
                    ...qs.parse(url.parse(req.url, true).search?.substr(1) as string, {})
                } as { lang: string }

                if (params?.lang && locals.includes(params?.lang)) {
                    try {
                        const dir = `${params?.lang === 'en-US' ? workflowsDir : join(localDir, params?.lang)}`;
                        const workflowsFiles = readdirSync(dir, {
                            withFileTypes: true,
                            recursive: false,
                        });

                        const workflowFile = workflowsFiles?.find((workflowFile) => {
                            if (workflowFile.name.includes('categories')) return false;
                            if (!workflowFile.isFile()) return false;
                            if (!workflowFile.name.endsWith('.json')) return false;

                            const workflow: Workflow = readJSONSync(join(dir, workflowFile?.name))

                            return `${workflow?.id}` === id;
                        })

                        if (workflowFile) {
                            const workflow: Workflow = readJSONSync(join(dir, workflowFile?.name))

                            return Response.json(workflow, {status: 200});
                        }
                    } catch (e: any) {
                        return Response.json({message: e.message,}, {status: 500});
                    }
                }

                return new Response("Not Found", {status: 404});
            }
        },
        "/api/categories/": {
            GET: async (req: any) => {
                const params: { lang: string } = {
                    lang: 'en-US',
                    ...qs.parse(url.parse(req.url, true).search?.substr(1) as string, {})
                } as { lang: string }

                if (params?.lang && locals.includes(params?.lang)) {
                    try {
                        const dir = `${params?.lang === 'en-US' ? workflowsDir : join(localDir, params?.lang)}`;
                        const path = resolve(dir, 'categories.json')
                        const categories: Array<Category> = readJSONSync(path)

                        return Response.json(categories, {status: 200});
                    } catch (e: any) {
                        return Response.json({message: e.message,}, {status: 500});
                    }
                }

                return new Response("Not Found", {status: 404});
            }
        },
        '/schema': {
            GET: async (req: any) => {
                const spec = openapiSpec;
                const url = new URL(req.url);

                if (!spec.servers) spec.servers = []
                spec.servers.push({url: `${url.protocol}//${url.host}`, description: "Unitalk AI Automation server"})

                return new Response(JSON.stringify(spec, null, 2), {
                    headers: {"Content-Type": "application/json"},
                });
            }
        },
        "/": {
            GET: async (req: any) => {
                const relativePath = "/index.html";
                let filePath = join(swaggerDist.getAbsoluteFSPath(), relativePath);

                try {
                    let content = await readFileSync(filePath, 'utf8');

                    if (relativePath === "/index.html") {
                        content = content.replace(
                            "url: \"https://petstore.swagger.io/v2/swagger.json\"",
                            "url: '/schema'"
                        );
                    }

                    return new Response(content, {
                        headers: {
                            "Content-Type": relativePath.endsWith(".css")
                                ? "text/css"
                                : relativePath.endsWith(".js")
                                    ? "application/javascript"
                                    : "text/html",
                        },
                    });
                } catch (e) {
                    console.error(e)
                    return new Response("Not found", {status: 404});
                }
            }
        }
    },
    // Enable development mode for:
    // - Detailed error messages
    // - Hot reloading (Bun v1.2.3+ required)
    development: cli_params?.dev,
    hostname: cli_params?.host,
    port: cli_params?.port,
    idleTimeout: 255,
    async fetch(req) {
        const url = new URL(req.url);

        const relativePath = url?.pathname;
        let filePath = join(swaggerDist.getAbsoluteFSPath(), relativePath);

        try {
            let content = await readFileSync(filePath, 'utf8');

            if (relativePath?.includes("swagger-initializer.js")) {
                content = content.replace(
                    "url: \"https://petstore.swagger.io/v2/swagger.json\"",
                    "url: '/schema'"
                );
            }

            return new Response(content, {
                headers: {
                    "Content-Type": relativePath.endsWith(".css")
                        ? "text/css"
                        : relativePath.endsWith(".js")
                            ? "application/javascript"
                            : "text/html",
                },
            });
        } catch (e) {
            console.error(e)
        }

        return new Response("Not Found", {status: 404});
    },
})

const unitalk = figlet.textSync("Unitalk AI");
console.log(unitalk)

console.log(`Listening on http://${server.hostname}:${server.port} in "${server?.development ? 'development' : 'production'}" mode ...`);

export default server
