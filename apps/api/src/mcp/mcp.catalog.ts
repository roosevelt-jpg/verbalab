import { MCP_TOOLS, MCP_SERVER_INFO, MCP_PROTOCOL_VERSION } from './mcp.tools';

export { MCP_TOOLS, MCP_SERVER_INFO, MCP_PROTOCOL_VERSION };

export function mcpDiscovery() {
  return {
    product: 'Lugemi MCP',
    note: 'Connect agent IDEs to first-party Lugemi models (Baobab, Echo, Atlas) via Model Context Protocol.',
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: MCP_SERVER_INFO,
    transports: {
      streamableHttp: 'POST /v1/mcp',
      stdio: '@lugemi/mcp (lugemi-mcp)',
    },
    auth: {
      type: 'bearer',
      header: 'Authorization: Bearer lg_live_… | lg_test_…',
      prefixes: ['lg_live_', 'lg_test_'],
    },
    models: ['Baobab', 'Echo', 'Atlas'],
    tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    docs: '/mcp',
    openapi: '/v1/openapi.json',
  };
}
