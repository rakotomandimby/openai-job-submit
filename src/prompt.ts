export function getPrompt(language: string, company: string, position: string, words: string): string {
  if (language === 'French') { 
    return 'Écris une lettre de motivation de ' + words + ' mots pour postuler au poste "' + position + '" dans la société "' + company + '".';
  }
  if (language === 'English') {
    return 'Write a ' + words + ' words cover letter to apply for the "' + position + '" position at the "' + company + '" company.';
  }
  return '';
}
