
export interface CompanyInfo {
  companyName: string;
  registryNumber: string;
  location: string;
  country: string;
  website: string;
  justification: string;
  confidenceLevel: string;
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