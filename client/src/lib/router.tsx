import React, { useState, useEffect, createContext, useContext } from 'react';

interface RouterContextType {
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  searchParams: new URLSearchParams(),
  navigate: () => {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
  );

  useEffect(() => {
    const onPopState = () => {
      setUrl(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setUrl(window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [pathPart, searchPart] = url.split('?');

  return (
    <RouterContext.Provider
      value={{
        pathname: pathPart || '/',
        searchParams: new URLSearchParams(searchPart || ''),
        navigate,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function Link({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href={href}
      className={className}
      onClick={e => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !href.startsWith('http')) {
          e.preventDefault();
          onClick?.();
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}

