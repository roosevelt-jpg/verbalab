import { RequestMethod, type Type } from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  MODULE_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

export const HTTP_METHODS: readonly HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

export interface DiscoveredRoute {
  method: HttpMethod;
  /** OpenAPI-style path, e.g. /v1/languages/{code} */
  path: string;
  controller: string;
  handler: string;
  guards: string[];
  /** Named @Query('x') parameters. */
  query: string[];
  /** Handler reads the whole query object (@Query() with no name). */
  queryObject: boolean;
  /** Named @Body('x') fields. */
  bodyFields: string[];
  /** Handler reads a request body (@Body or @RawBody). */
  body: boolean;
  /** Handler accepts multipart file uploads (@UploadedFile / @UploadedFiles). */
  file: boolean;
  /** Handler writes the response itself (@Res), e.g. audio or downloads. */
  rawResponse: boolean;
  /** Success status: @HttpCode, else Nest's default (201 for POST, 200 otherwise). */
  status: number;
}

const METHOD_NAMES: Partial<Record<RequestMethod, HttpMethod[]>> = {
  [RequestMethod.GET]: ['get'],
  [RequestMethod.POST]: ['post'],
  [RequestMethod.PUT]: ['put'],
  [RequestMethod.PATCH]: ['patch'],
  [RequestMethod.DELETE]: ['delete'],
  [RequestMethod.HEAD]: ['head'],
  [RequestMethod.OPTIONS]: ['options'],
  [RequestMethod.ALL]: ['get', 'post', 'put', 'patch', 'delete'],
};

type ModuleRef = { module?: Type<unknown>; forwardRef?: () => unknown; [key: string]: unknown };

function resolveModule(entry: unknown): { cls?: Type<unknown>; dynamic?: Record<string, unknown> } {
  if (!entry) return {};
  if (typeof entry === 'function') return { cls: entry as Type<unknown> };
  if (typeof entry === 'object') {
    const ref = entry as ModuleRef;
    if (typeof ref.forwardRef === 'function') return resolveModule(ref.forwardRef());
    if (typeof ref.module === 'function') return { cls: ref.module, dynamic: ref };
  }
  return {};
}

/** Every controller reachable from a root module, following static and dynamic imports. */
export function collectControllers(root: Type<unknown>): Type<unknown>[] {
  const seenModules = new Set<unknown>();
  const controllers = new Set<Type<unknown>>();
  const visit = (entry: unknown) => {
    const { cls, dynamic } = resolveModule(entry);
    if (!cls) return;
    const key = dynamic ?? cls;
    if (seenModules.has(key)) return;
    seenModules.add(key);
    const staticControllers = (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, cls) ?? []) as Type<unknown>[];
    const dynamicControllers = (dynamic?.controllers ?? []) as Type<unknown>[];
    for (const c of [...staticControllers, ...dynamicControllers]) controllers.add(c);
    const imports = [
      ...((Reflect.getMetadata(MODULE_METADATA.IMPORTS, cls) ?? []) as unknown[]),
      ...((dynamic?.imports ?? []) as unknown[]),
    ];
    for (const imported of imports) visit(imported);
  };
  visit(root);
  return [...controllers];
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [typeof value === 'string' ? value : '/'];
}

/** Express-style path (":id", ":id?", "*") → OpenAPI path ("{id}"). */
export function toOpenApiPath(...segments: string[]): string {
  const joined = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return `/${joined}`
    .replace(/:([A-Za-z0-9_]+)\??/g, '{$1}')
    .replace(/\(\.\*\)|\*/g, '{path}')
    .replace(/\/{2,}/g, '/');
}

function guardNames(...targets: object[]): string[] {
  const names = new Set<string>();
  for (const target of targets) {
    for (const guard of (Reflect.getMetadata(GUARDS_METADATA, target) ?? []) as Array<{ name?: string }>) {
      if (guard?.name) names.add(guard.name);
    }
  }
  return [...names];
}

function handlerNames(prototype: object): string[] {
  const names = new Set<string>();
  for (let proto = prototype; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
    for (const name of Object.getOwnPropertyNames(proto)) if (name !== 'constructor') names.add(name);
  }
  return [...names];
}

interface RouteArgs {
  query: string[];
  queryObject: boolean;
  bodyFields: string[];
  body: boolean;
  file: boolean;
  rawResponse: boolean;
}

function routeArgs(controller: Type<unknown>, handler: string): RouteArgs {
  const meta = (Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, handler) ?? {}) as Record<
    string,
    { data?: unknown }
  >;
  const out: RouteArgs = { query: [], queryObject: false, bodyFields: [], body: false, file: false, rawResponse: false };
  for (const [key, arg] of Object.entries(meta)) {
    const type = Number(key.split(':')[0]);
    const name = typeof arg?.data === 'string' ? arg.data : undefined;
    if (type === RouteParamtypes.QUERY) {
      if (name) out.query.push(name);
      else out.queryObject = true;
    } else if (type === RouteParamtypes.BODY || type === RouteParamtypes.RAW_BODY) {
      out.body = true;
      if (name) out.bodyFields.push(name);
    } else if (type === RouteParamtypes.FILE || type === RouteParamtypes.FILES) {
      out.file = true;
    } else if (type === RouteParamtypes.RESPONSE) {
      out.rawResponse = true;
    }
  }
  return out;
}

export function routesFromControllers(controllers: Iterable<Type<unknown>>): DiscoveredRoute[] {
  const routes = new Map<string, DiscoveredRoute>();
  for (const controller of controllers) {
    if (Reflect.getMetadata(PATH_METADATA, controller) === undefined) continue;
    const basePaths = asArray(Reflect.getMetadata(PATH_METADATA, controller));
    const prototype = controller.prototype as Record<string, unknown>;
    for (const handler of handlerNames(prototype)) {
      const fn = prototype[handler];
      if (typeof fn !== 'function') continue;
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, fn) as RequestMethod | undefined;
      if (requestMethod === undefined) continue;
      const methodPaths = asArray(Reflect.getMetadata(PATH_METADATA, fn));
      const guards = guardNames(controller, fn);
      const args = routeArgs(controller, handler);
      const httpCode = Reflect.getMetadata(HTTP_CODE_METADATA, fn) as number | undefined;
      for (const base of basePaths) {
        for (const sub of methodPaths) {
          const path = toOpenApiPath(base, sub);
          for (const method of METHOD_NAMES[requestMethod] ?? []) {
            const key = `${method} ${path}`;
            if (routes.has(key)) continue;
            routes.set(key, {
              method,
              path,
              controller: controller.name,
              handler,
              guards,
              ...args,
              status: httpCode ?? (method === 'post' ? 201 : 200),
            });
          }
        }
      }
    }
  }
  return [...routes.values()].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

export function discoverRoutes(root: Type<unknown>): DiscoveredRoute[] {
  return routesFromControllers(collectControllers(root));
}
