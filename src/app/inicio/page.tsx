import { permanentRedirect } from "next/navigation";

// The home page lives at "/". This keeps old links and saved bookmarks working.
export default function InicioPage() {
  permanentRedirect("/");
}
