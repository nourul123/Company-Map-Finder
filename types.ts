export interface CompanyInfo {
  companyName: string;
  registryNumber: string;
  location: string;
  country: string;
  website: string;
  parentCompany?: string;
  parentCompanySource?: string;
  subsidiaries?: string;
  subsidiariesSource?: string;
  websiteSummary: string;
  justification: string;
  confidenceLevel: string;
  verifiedOnWebsite: string;
  verifiedOfficers: string;
  KeyExecutives?: string;
  RecentNewsSummary?: string;
  BusinessActivities?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  }
}