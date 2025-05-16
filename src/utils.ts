export function nullToEmptyString(str: string | null): string {
  if (str === null) { return "";}
  else { return str;}
}

export function nl2br(str: string): string {
  return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

export function getAPIKey(modelName:string): string {
  if (modelName === "openai") {
    if (process.env["OPENAI_API_KEY"] === undefined) {return "";}
    else {return process.env["OPENAI_API_KEY"];}
  }
  else if (modelName === "gemini") {
    if (process.env["GEMINI_API_KEY"] === undefined) {return "";}
    else {return process.env["GEMINI_API_KEY"];}
  }
  else {return "";}
}

// Modified getAuthToken to return null if not set or empty
export function getAuthToken(): string | null {
  const token = process.env["AUTH_TOKEN"];
  if (token === undefined || token === "") {
    // Log a warning on the server side for critical missing configuration
    console.warn("CRITICAL: AUTH_TOKEN environment variable is not set or is empty. Application security is compromised.");
    return null;
  }
  return token;
}

