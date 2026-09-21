import { useEffect } from "react";
import { PUBLIC_URL } from "../config";

function setMeta(selector: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const attr = selector.startsWith("meta[name=") ? "name" : "property";
    const key = selector.match(/(?:name|property)="([^"]+)"/)?.[1];
    if (key) el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', description ?? "");
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description ?? "");
    setMeta(
      'meta[property="og:url"]',
      PUBLIC_URL + window.location.pathname + window.location.search,
    );
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", PUBLIC_URL + window.location.pathname);
  }, [title, description]);
}