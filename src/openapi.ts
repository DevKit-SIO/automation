import type {OpenAPIObject} from "openapi3-ts/oas31";

export const openapiSpec: OpenAPIObject = {
    openapi: "3.0.3",
    info: {
        title: "Unitalk AI Automation API Doc",
        version: "1.0.0",
        description: "API documentation for the Unitalk AI Automation library",
        contact: {
            name: 'Taha EL MAHDAOUI',
            email: 'taha.elmahdaoui.te@gmail.com'
        }
    },
    // servers: [{url: "/"}],
    components: {
        schemas: {
            Category: {
                type: "object",
                properties: {
                    id: {type: "number"},
                    name: {type: "string"}
                }
            },
            NodeCategory: {
                type: "object",
                properties: {
                    id: {type: "number"},
                    name: {type: "string"}
                }
            },
            User: {
                type: "object",
                properties: {
                    avatar: {type: "string"},
                    bio: {type: "string"},
                    links: {type: "array", items: {type: "string"}},
                    name: {type: "string"},
                    username: {type: "string"},
                    verified: {type: "boolean"},
                }
            },
            Connection: {
                type: "object",
                properties: {
                    "Node Name": {
                        type: "object",
                        properties: {
                            index: {type: "number"},
                            node: {type: "string"},
                            type: {type: "string"},
                        }
                    }
                }
            },
            Node: {
                type: "object",
                properties: {
                    id: {type: "string"},
                    name: {type: "string"},
                    parameters: {
                        type: "object",
                        properties: {
                            "Parameter Name": {type: "object"}
                        }
                    },
                    position: {
                        type: "array",
                        items: {
                            type: "number"
                        }
                    },
                    type: {type: "string"},
                    typeVersion: {type: "number"},
                }
            },
            NodeInfo: {
                type: "object",
                properties: {
                    id: {type: "number"},
                    name: {type: "string"},
                    codex: {
                        type: "object",
                        properties: {
                            data: {
                                type: "object",
                                properties: {
                                    alias: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },
                                    categories: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },
                                    codexVersion: {type: "string"},
                                    nodeVersion: {type: "string"},
                                    subcategories: {
                                        type: "object",
                                        properties: {
                                            "Sub Category Name": {
                                                type: "array",
                                                items: {
                                                    type: "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    defaults: {
                        type: "object",
                        properties: {
                            color: {type: "string"},
                            name: {type: "string"},
                        }
                    },
                    displayName: {type: "string"},
                    group: {type: "string"},
                    icon: {type: "string"},
                    iconData: {
                        type: "object",
                        properties: {
                            icon: {type: "string"},
                            type: {type: "string"},
                        }
                    },
                    nodeCategories: {
                        type: "array",
                        items: {
                            "$ref": "#/components/schemas/NodeCategory"
                        }
                    },
                    typeVersion: {type: "number"},
                },
            },
            Agent: {
                type: "object",
                properties: {
                    connections: {
                        type: "array",
                        items: {
                            "$ref": "#/components/schemas/Connection"
                        }
                    },
                    meta: {
                        type: "object",
                        properties: {
                            instanceId: {type: "string"},
                            templateId: {type: "string"},
                        }
                    },
                    nodes: {
                        type: "array",
                        items: {
                            "$ref": "#/components/schemas/Node"
                        }
                    },
                    pinData: {type: "object"},
                }
            },
            Workflow: {
                type: "object",
                properties: {
                    id: {type: "number"},
                    name: {type: "string"},
                    categories: {
                        type: "array",
                        items: {
                            "$ref": "#/components/schemas/Category"
                        }
                    },
                    image: {
                        type: "array",
                        items: {type: "string"}
                    },
                    lastUpdatedBy: {type: "number"},
                    recentViews: {type: "number"},
                    totalViews: {type: "number"},
                    purchaseUrl: {type: "string"},
                    user: {
                        type: "object",
                        "$ref": "#/components/schemas/User",
                    },
                    views: {type: "number"},
                    description: {type: "string"},
                    createdAt: {type: "string"},
                    nodes: {
                        type: "array",
                        items: {
                            "$ref": "#/components/schemas/NodeInfo"
                        }
                    },
                    workflow: {
                        type: "object",
                        "$ref": "#/components/schemas/Agent",
                    },
                    workflowInfo: {
                        type: "object",
                        properties: {
                            nodeCount: {type: "number"},
                            nodeTypes: {
                                type: "object",
                                properties: {
                                    "Node Type Name": {
                                        type: "object",
                                        properties: {
                                            count: {type: "number"},
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    paths: {
        "/api/workflows/": {
            get: {
                summary: "Get All Workflows resources",
                parameters: [
                    {
                        name: "page",
                        in: "query",
                        required: false,
                        schema: {
                            type: "number",
                            default: 1,
                        }
                    },
                    {
                        name: "items",
                        in: "query",
                        required: false,
                        schema: {
                            type: "number",
                            default: 25,
                        },
                    },
                    {
                        name: "lang",
                        in: "query",
                        required: false,
                        schema: {
                            type: "string",
                            default: "en-US",
                            enum: ["en-US", "fr-FR"]
                        },
                    },
                    {
                        name: "categories",
                        in: "query",
                        required: false,
                        schema: {
                            type: "array",
                            items: {
                                type: "number"
                            }
                        },
                    },
                ],
                responses: {
                    "200": {
                        description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        '$ref': '#/components/schemas/Workflow'
                                    }
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/workflows/{id}/": {
            get: {
                summary: "Get Workflow resource by ID",
                parameters: [
                    {
                        name: 'id',
                        in: "path",
                        required: true,
                        schema: {
                            type: "number",
                        }
                    },
                    {
                        name: "lang",
                        in: "query",
                        required: false,
                        schema: {
                            type: "string",
                            default: "en-US",
                            enum: ["en-US", "fr-FR"]
                        },
                    },
                ],
                responses: {
                    "200": {
                        description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    '$ref': '#/components/schemas/Workflow'
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/categories/": {
            get: {
                summary: "Get All Categories resources",
                parameters: [
                    {
                        name: "lang",
                        in: "query",
                        required: false,
                        schema: {
                            type: "string",
                            default: "en-US",
                            enum: ["en-US", "fr-FR"]
                        },
                    },
                ],
                responses: {
                    "200": {
                        description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        '$ref': '#/components/schemas/Category'
                                    }
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
