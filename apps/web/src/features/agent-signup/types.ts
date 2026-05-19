export interface AgentWizardState {
  step: 1 | 2 | 3 | 4;
  // Step 1
  fullName: string;
  phone: string;
  headshotFile?: File;
  headshotPreview?: string;
  // Step 2
  agencyMode: 'join' | 'create';
  existingAgencyId?: string;
  existingAgencyName?: string;
  newAgencyName?: string;
  newAgencyAddress?: string;
  newAgencyPhone?: string;
  newAgencyLogoFile?: File;
  // Step 3
  licenseNo: string;
  licenseDocFile?: File;
  bio: string;
  yearsActive: number;
}

export const WIZARD_DEFAULTS: AgentWizardState = {
  step: 1,
  fullName: '',
  phone: '',
  agencyMode: 'join',
  licenseNo: '',
  bio: '',
  yearsActive: 1,
};
