import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";

import stylesheet from "~/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full card text-center">
        <div className="text-6xl mb-4">😱</div>
        {isRouteErrorResponse(error) ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error.status} {error.statusText}
            </h1>
            <p className="text-gray-600">{error.data}</p>
          </>
        ) : error instanceof Error ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <pre className="text-left text-sm bg-gray-100 p-4 rounded overflow-auto">
              {error.stack}
            </pre>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unknown Error
            </h1>
            <p className="text-gray-600">Something unexpected happened</p>
          </>
        )}
        <a href="/" className="btn btn-primary mt-6 inline-block">
          Go Home
        </a>
      </div>
    </div>
  );
}

