import { Query, Resolver } from '@nestjs/graphql';
import { PluginRuntimeService } from '../plugin-runtime/plugin-runtime.service';
import { GqlPluginRuntimeEngine } from './gql.types';

@Resolver()
export class PluginRuntimeGraphqlResolver {
  constructor(private readonly runtime: PluginRuntimeService) {}

  @Query(() => GqlPluginRuntimeEngine, { name: 'pluginRuntimeEngine' })
  pluginRuntimeEngine(): GqlPluginRuntimeEngine {
    const c = this.runtime.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      openToolExecution: c.honesty.openToolExecution,
      liveCodeExecution: c.honesty.liveCodeExecution,
      browserExtensionOs: c.honesty.browserExtensionOs,
      vsCodeExtensionOs: c.honesty.vsCodeExtensionOs,
      wasmPluginOs: c.honesty.wasmPluginOs,
      extendsMarketplace: c.honesty.extendsMarketplace,
      regeneratesMarketplace: c.honesty.regeneratesMarketplace,
      scopedPermissionsRequired: c.honesty.scopedPermissionsRequired,
      sandboxRequired: c.honesty.sandboxRequired,
      policyHardGateRequired: c.honesty.policyHardGateRequired,
      policyRuntimeWired: c.honesty.policyRuntimeWired,
      localPermissionHardGate: c.honesty.localPermissionHardGate,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      mode: c.mode,
      maxPluginsPerWorkspace: c.ceilings.maxPluginsPerWorkspace,
    };
  }
}
