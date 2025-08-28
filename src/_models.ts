export type ID = number

export type Category = {
    id: ID
    name: string
}

export type User = {
    avatar: string
    bio: string
    links: Array<string>
    name: string
    username: string
    verified: boolean
}

export type Connection = {
    [name: string]: {
        [name: string]: Array<{
            index: number
            node: string
            type: string
        }>
    }
}

export type Node = {
    id: string
    name: string
    parameters: {
        [name: string]: any
    }
    position: Array<number>
    type: string
    typeVersion: number
}

export type NodeCategory = {
    id: ID
    name: string
}

export type NodeInfo = {
    id: ID
    name: string
    codex: {
        data: {
            alias: Array<string>
            categories: Array<string>
            codexVersion: string
            nodeVersion: string
            subcategories: Array<{
                [name: string]: Array<string>
            }>
        }
    }
    defaults: {
        color: string
        name: string
    }
    displayName: string
    group: string
    icon: string
    iconData: {
        icon: string
        type: string
    }
    nodeCategories: Array<NodeCategory>
    typeVersion: number
}

export type Agent = {
    connections: Array<Connection>
    meta: {
        instanceId: string
        templateId: string
    }
    nodes: Array<Node>
    pinData: any
}

export type Workflow = {
    id: ID
    name: string
    categories: Array<Category>
    image: Array<string>
    lastUpdatedBy: number
    recentViews: number,
    totalViews: number
    purchaseUrl: string | null
    user: User
    views: number
    description: string
    createdAt: string
    nodes: Array<NodeInfo>
    workflow: Agent
    workflowInfo: {
        nodeCount: number
        nodeTypes: {
            [name: string]: {
                count: number
            }
        }
    }
}

export type ResponseCollection<T> = {
    totalWorkflows: number
    workflows: Array<T>
    filters: Array<{
        counts: Array<{
            count: number
            highlighted: string
            value: string
        }>
        field_name: string
        sampled: boolean
        stats: {
            total_values: number
        }
    }>
}

export type Response<T> = {
    workflow: T
}
