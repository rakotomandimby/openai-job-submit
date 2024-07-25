export function getPrompt(language: string, company: string, position: string, chars: string): string {
  if (language === 'French') { 
    const langue = 'français';
    return 'Écris une lettre de motivation limitée à '+chars+' caratères en '+langue+' pour postuler au poste "'+position+'" dans la société "'+company+'".';
  }

  if (language === 'English') {
    return 'Write a less than '+chars+' caracters cover letter for the "'+position+'" position at the company "'+company+'".';
  }
  return '';
}
