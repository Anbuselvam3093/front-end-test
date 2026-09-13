import React from 'react';
import Module from 'node:module';

type ModuleExports = {
  default?: unknown;
  __esModule?: boolean;
  [key: string]: unknown;
};

type MutableModule = NodeJS.Module & { exports: ModuleExports };

if (typeof require !== 'undefined' && require.extensions) {
  const handler = (module: NodeJS.Module) => {
    const proxy = new Proxy(
      {},
      {
        get: (_target, prop) => (typeof prop === 'string' ? prop : ''),
      }
    );
    const mutableModule = module as MutableModule;
    mutableModule.exports = proxy as ModuleExports;
    mutableModule.exports.default = proxy;
    mutableModule.exports.__esModule = true;
  };

  require.extensions['.css'] = handler;
  require.extensions['.module.css'] = handler;
  require.extensions['.scss'] = handler;

  const originalRequire = Module.prototype.require as (
    this: NodeJS.Module,
    id: string,
    ...args: unknown[]
  ) => unknown;
  Module.prototype.require = function (this: NodeJS.Module, id: string, ...rest: unknown[]) {
    if (id === 'next/navigation') {
      return {
        useRouter: () => ({ replace: () => {} }),
        usePathname: () => '/results',
        useSearchParams: () => new URLSearchParams('location=orlando&gateway=london&departureDate=2026-09-14'),
      };
    }
    if (id === 'next/image') {
      return {
        __esModule: true,
        default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
          const { src, alt, ...restImageProps } = props as React.ImgHTMLAttributes<HTMLImageElement> & {
            fill?: boolean;
            unoptimized?: boolean;
          };

          const imageProps = { ...restImageProps } as Record<string, unknown>;
          delete imageProps.fill;
          delete imageProps.sizes;
          delete imageProps.unoptimized;

          return React.createElement('img', {
            src: typeof src === 'string' ? src : '',
            alt: alt || '',
            ...imageProps,
          });
        },
      };
    }
    return originalRequire.call(this, id, ...rest);
  };
}
