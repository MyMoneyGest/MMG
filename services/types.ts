// types.ts
export interface EnterpriseData {
  nom: string;
  rccm: string;
  nif: string;
  formeJuridique: string;
  secteur: string;
  adresse: string;
  telephone: string;
}

export interface ManagerData {
  nom: string;
  fonction: string;
  email: string;
}

export interface User {
  uid: string;
  email: string;
  type: 'enterprise' | 'collaborator';
  createdAt: any;
  displayName: string;
  enterpriseId?: string;
}

export interface Enterprise {
  uid: string;
  nom: string;
  rccm: string;
  nif: string;
  formeJuridique: string;
  secteur: string;
  adresse: string;
  telephone: string;
  dirigeant: ManagerData;
  createdAt: any;
  createdBy: string;
}