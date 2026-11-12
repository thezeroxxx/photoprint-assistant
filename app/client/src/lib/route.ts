/** Hash routes, so reload and Back work without a router library. */
export type Route =
  | { name: "new" }
  | { name: "chat"; id: string }
  | { name: "meetings" }
  | { name: "tasks" }
  | { name: "report"; id: string };

export function parseHash(hash = window.location.hash): Route {
  const chat = hash.match(/^#\/chat\/([\w-]+)$/);
  if (chat?.[1]) return { name: "chat", id: chat[1] };
  const report = hash.match(/^#\/report\/([\w-]+)$/);
  if (report?.[1]) return { name: "report", id: report[1] };
  if (hash === "#/meetings") return { name: "meetings" };
  if (hash === "#/tasks") return { name: "tasks" };
  return { name: "new" };
}

export const go = (hash: string) => {
  window.location.hash = hash;
};
