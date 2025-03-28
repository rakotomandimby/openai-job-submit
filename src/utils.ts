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

// write e function that gets an AUTH_TOKEM from the environment variable

export function getAuthToken(): string {
  if (process.env["AUTH_TOKEN"] === undefined) {return "";} 
  else {return process.env["AUTH_TOKEN"];}
}
