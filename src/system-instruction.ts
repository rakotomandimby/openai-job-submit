import fs from 'fs';

export function getSystemInstruction(company: string, job: string, words: string, language: string): string {
  const cv_en = fs.readFileSync('./src/cv-en.md', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.md', 'utf8');


  const  system_instruction_fr = 
    '# Instructions \n\n'
    + 'Agis en tant que chercheur d\'emplpi qui veut rédiger une lettre de motivation qui sera utile pour obtenir un emploi. '
    + 'Prends ce que tu sais sur la société "' + company + '" '
    + 'et écris une lettre de motivation de ' + words + ' mots avec des mots qui sont significatifs pour ' 
    + 'le responsable de recrutements de la societé' + company + '. '
    + 'Voici la description du poste convoité:\n\n"' + job + '".\n'
    + 'Le CV est le suivant:\n\n"' + cv_fr + '".\n'
    + 'Parles à la première personne, tu es le candidat.';
  const  system_instruction_en = 
    '# Instructions \n\n'
    + 'Act as a job seeker who need to write a cover letter that will be valuable to get a job. '
    + 'Grab what you have about the company "' + company + '" '
    + 'and write a '+ words +' words cover letter with words that are meaningfull to human resource staff.\n\n'
    + 'This is the job description:\n\n"'+ job + '".\n'
    + 'The CV is following:\n\n"' + cv_en + '".\n'
    + 'You will talk at the first person, as you are the candidate.'

  if (language === 'French') {
    return system_instruction_fr;
  }
  if (language === 'English') {
    return system_instruction_en;
  }
  return '';
}

