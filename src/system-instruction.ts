import fs from 'fs';

export function getSystemInstruction(company: string, job: string, chars: string, language: string): string {
  const cv_en = fs.readFileSync('./src/cv-en.txt', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.txt', 'utf8');


  const  system_instruction_fr = 'Compte tenu d\'une description de poste et d\'un CV, agis en tant qu\'assistant qui aide à rédiger une lettre de motivation qui sera utile pour obtenir un emploi.'
    + 'Prends ce que tu sais sur la société "'+company+'"'
    + 'et écris une lettre de motivation avec limitée à '+chars+' caractères avec des mots qui sont significatifs pour le responsable de recrutements de la societé' + company + '. '
    + 'Voici la description de poste:\n"'+job+'".\n'
    + 'Le CV du candidat est le suivant:\n"' + cv_fr + '".\n'
    + 'Parles à la première personne, comme si tu étais le candidat.';
  const  system_instruction_en = 'Given a job description and a CV, act as an assistant that helps to write a cover letter that will be valuable to get a job.'
    + 'Grab what you have about the company "'+company+'"'
    + 'and write a less than '+chars+' characters cover letter with words that are meaningfull to human resource staff. '
    + 'This is the job description:\n"'+job+'".\n'
    + 'The CV is the following:\n"' + cv_en + '".\n'
    + 'You will talk at the first person, as if you were the candidate.'

  if (language === 'French') {
    return system_instruction_fr;
  }
  if (language === 'English') {
    return system_instruction_en;
  }
  return '';
}

