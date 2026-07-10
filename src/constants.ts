/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleDraft {
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  text: string;
}

export const SAMPLE_DRAFTS: SampleDraft[] = [
  {
    name: 'Patient Intake Form',
    nameEs: 'Formulario de Admisión de Pacientes',
    description: 'A standard medical intake form with patient details, history, and consent.',
    descriptionEs: 'Un formulario médico estándar con datos del paciente, historial y consentimiento.',
    text: `CLINIC PATIENT INTAKE FORM
    
General Information:
- First Name:
- Last Name:
- Date of Birth (MM/DD/YYYY):
- Gender (Male, Female, Other, Prefer not to say):
- Phone Number:
- Email Address:
- Home Address:
- City:
- State:
- Zip Code:

Emergency Contact Information:
- Contact Person Full Name:
- Relationship to Patient:
- Contact Phone:

Medical Background:
- Primary Care Physician Name:
- Are you currently taking any medications? (Yes / No)
- If yes, please list medications and dosages:
- Known Allergies (e.g., Penicillin, Latex, Peanuts):
- Do you have any of the following chronic conditions? (Check all that apply):
  [ ] Hypertension
  [ ] Diabetes (Type 1 or 2)
  [ ] Asthma or respiratory issues
  [ ] Heart disease
  [ ] None of the above

Consent and Signature:
- I authorize this clinic to provide necessary medical care and treatment.
- Patient/Guardian Signature:
- Date of Signature:
`
  },
  {
    name: 'Job Application Draft',
    nameEs: 'Borrador de Solicitud de Empleo',
    description: 'A structured job application asking for personal details, education, and experience.',
    descriptionEs: 'Una solicitud de empleo estructurada que solicita datos personales, educación y experiencia.',
    text: `JOB APPLICATION FORM - TECH SOLUTIONS INC.

Applicant Information:
- Position Applied For:
- Date Available to Start:
- Desired Salary ($ / year):
- Full Name:
- Email Address:
- Phone:
- LinkedIn Profile URL:

Education Background:
- Highest Level of Education (High School, Associate, Bachelor, Master, PhD):
- Institution Name:
- Major/Field of Study:
- Graduation Year:

Work Experience (Last Job):
- Previous Company Name:
- Job Title:
- Start Date:
- End Date:
- Key Responsibilities:

General Questions:
- Are you legally authorized to work in the United States? (Yes / No)
- Will you now or in the future require sponsorship for employment visa status? (Yes / No)
- How did you hear about this position? (Select: Job Board, Company Website, Referral, Agency, Other):

Applicant Statement:
- I certify that my answers are true and complete to the best of my knowledge.
- Signature of Applicant:
- Date:`
  },
  {
    name: 'Customer Feedback Survey',
    nameEs: 'Encuesta de Satisfacción del Cliente',
    description: 'A service feedback form with numerical ratings, checkboxes, and text feedback.',
    descriptionEs: 'Un formulario de comentarios sobre el servicio con calificaciones, casillas y texto.',
    text: `DELUXE DINING EXPERIENCE - CUSTOMER SURVEY

Visit Information:
- Date of Visit:
- Time of Day (Lunch, Dinner, Happy Hour):
- Table Number:
- Server Name:

Service Evaluation:
- Food Quality (Excellent, Good, Fair, Poor):
- Service Speed (Excellent, Good, Fair, Poor):
- Staff Friendliness (Excellent, Good, Fair, Poor):
- Cleanliness (Excellent, Good, Fair, Poor):

Specific feedback:
- What did you order today? (List items separated by commas):
- Would you recommend us to a friend or colleague? (Yes / No)
- What did we do best?
- Where can we improve?

Stay Connected:
- Would you like to join our VIP club for exclusive discounts? (Yes / No)
- If yes, provide your Email Address:
- First Name:
- Last Name:`
  }
];

// Beautiful base64 sample SVG logo
export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="%232563eb" opacity="0.15"/><path d="M50 20 L80 70 L20 70 Z" fill="%232563eb" stroke="%231d4ed8" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="52" r="10" fill="%23ffffff"/><circle cx="50" cy="52" r="4" fill="%232563eb"/></svg>`;

// Faded watermark background representation
export const DEFAULT_WATERMARK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" opacity="0.04"><circle cx="200" cy="200" r="160" fill="none" stroke="%232563eb" stroke-width="2" stroke-dasharray="10 5"/><path d="M200 100 L280 260 L120 260 Z" fill="none" stroke="%232563eb" stroke-width="2" stroke-linejoin="round"/><circle cx="200" cy="210" r="30" fill="none" stroke="%232563eb" stroke-width="2"/></svg>`;
