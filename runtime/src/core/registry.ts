import {isPlugin, Plugin} from './runtime'
import {Configuration, Host} from '../iframe/sandbox'
import Collector from '../error'

export type SandboxPlugin = {
    id: string
    src: string
    window: Window
}

export class Registry {
    private readonly _plugins: Map<string, Plugin> = new Map()
    private readonly _host: Host
    private readonly _errors: Collector

    constructor(config: Configuration, error: Collector) {
        this._host = new Host(config)
        this._errors = error
    }

    plugin(plugin: Plugin) {
        if (this._plugins.has(plugin.id)) this._errors.collect(plugin.id, 'already registered')
        else this._plugins.set(plugin.id, plugin)
    }

    plugins() {
        return [...this._plugins.values()]
    }

    sandbox(sandbox: SandboxPlugin) {
        try {
            return this._host.connect(sandbox.id, sandbox.window, new URL(sandbox.src).origin).then(context => {
                if (isPlugin(context)) {
                    let plugin = context as Plugin
                    if (plugin.id !== sandbox.id) this._errors.collect('sandbox', plugin.id, 'can not be registered as', sandbox.id)
                    else this.plugin(plugin)
                } else this._errors.collect('sandbox', sandbox.id, 'is not a plugin')
            }, error => this._errors.collect(error))
                .catch((reason) => this._errors.collect(reason as string))
        } catch (e) {
            this._errors.collect("invalid src")
            return new Promise(resolve => resolve({}))
        }
    }
}